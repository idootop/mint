import {
  dropFragmentShader,
  normalFragmentShader,
  simulationVertexShader,
  sphereVolumeFragmentShader,
  updateFragmentShader,
} from '../shaders/simulation';
import {
  createFullscreenQuad,
  createProgram,
  createRenderTarget,
  disposeQuad,
  disposeRenderTarget,
  getUniforms,
  type RenderTarget,
} from './gl-utils';

/** 纹理单元分配 */
export const TEX_UNIT_WATER = 0;
export const TEX_UNIT_TILES = 1;
export const TEX_UNIT_CAUSTICS = 2;
export const TEX_UNIT_DUCK_REFRACTION = 3;
export const TEX_UNIT_SKY = 4;
export const TEX_UNIT_DUCK_TEX = 5;

const SIM_SIZE = 1024;

interface Pass {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

/**
 * 水面高度场模拟（GPGPU ping-pong）。
 * 对应 three.js 时期的 core/Water.ts。
 */
export class WaterSimulation {
  private gl: WebGL2RenderingContext;
  private quad: ReturnType<typeof createFullscreenQuad>;

  textureA: RenderTarget;
  textureB: RenderTarget;

  private drop: Pass;
  private update: Pass;
  private normal: Pass;
  private sphere: Pass;

  poolWidth = 2;
  poolLength = 2;

  private readFloat = new Float32Array(4);
  private readHalf = new Uint16Array(4);

  constructor(
    gl: WebGL2RenderingContext,
    internalFormat: number,
    type: number,
  ) {
    this.gl = gl;
    this.quad = createFullscreenQuad(gl);

    const options = {
      internalFormat,
      format: gl.RGBA,
      type,
      linear: true,
    };
    this.textureA = createRenderTarget(gl, SIM_SIZE, SIM_SIZE, options);
    this.textureB = createRenderTarget(gl, SIM_SIZE, SIM_SIZE, options);

    const make = (
      fragment: string,
      attribs: Record<string, number>,
      label: string,
    ): Pass => {
      const program = createProgram(
        gl,
        simulationVertexShader,
        fragment,
        attribs,
        label,
      );
      return { program, uniforms: getUniforms(gl, program) };
    };

    // 全屏四边形：aPosition -> 0
    const attribs = { aPosition: 0 };
    this.drop = make(dropFragmentShader, attribs, 'water.drop');
    this.update = make(updateFragmentShader, attribs, 'water.update');
    this.normal = make(normalFragmentShader, attribs, 'water.normal');
    this.sphere = make(sphereVolumeFragmentShader, attribs, 'water.sphere');
  }

  updateDimensions(width: number, length: number) {
    this.poolWidth = width;
    this.poolLength = length;
  }

  /** 渲染到 textureB 后交换，使 textureA 始终是当前状态 */
  private renderTo(pass: Pass, setup: () => void) {
    const gl = this.gl;
    gl.bindVertexArray(this.quad.vao);
    gl.useProgram(pass.program);

    gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_WATER);
    gl.bindTexture(gl.TEXTURE_2D, this.textureA.texture);
    gl.uniform1i(pass.uniforms.textureMap, TEX_UNIT_WATER);
    gl.uniform2f(pass.uniforms.poolSize, this.poolWidth, this.poolLength);

    setup();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureB.fbo);
    gl.viewport(0, 0, this.textureB.width, this.textureB.height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.quad.vertexCount);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);

    const temp = this.textureA;
    this.textureA = this.textureB;
    this.textureB = temp;
  }

  addDrop(x: number, y: number, radius: number, strength: number) {
    const nx = x / (this.poolWidth / 2);
    const ny = y / (this.poolLength / 2);
    this.renderTo(this.drop, () => {
      const gl = this.gl;
      gl.uniform2f(this.drop.uniforms.center, nx, ny);
      gl.uniform1f(this.drop.uniforms.radius, radius);
      gl.uniform1f(this.drop.uniforms.strength, strength);
    });
  }

  moveSphere(
    oldCenter: { x: number; y: number; z: number },
    newCenter: { x: number; y: number; z: number },
    radius: number,
    strength: number,
  ) {
    const scaleX = this.poolWidth / 2;
    const scaleZ = this.poolLength / 2;
    this.renderTo(this.sphere, () => {
      const gl = this.gl;
      gl.uniform3f(
        this.sphere.uniforms.oldCenter,
        oldCenter.x / scaleX,
        oldCenter.y,
        oldCenter.z / scaleZ,
      );
      gl.uniform3f(
        this.sphere.uniforms.newCenter,
        newCenter.x / scaleX,
        newCenter.y,
        newCenter.z / scaleZ,
      );
      gl.uniform1f(this.sphere.uniforms.radius, radius);
      gl.uniform1f(this.sphere.uniforms.strength, strength);
    });
  }

  step() {
    const dx = 1 / this.textureA.width;
    const dy = 1 / this.textureA.height;
    this.renderTo(this.update, () => {
      this.gl.uniform2f(this.update.uniforms.delta, dx, dy);
    });
  }

  updateNormals() {
    const dx = 1 / this.textureA.width;
    const dy = 1 / this.textureA.height;
    this.renderTo(this.normal, () => {
      this.gl.uniform2f(this.normal.uniforms.delta, dx, dy);
    });
  }

  /** 回读指定世界坐标处的水面高度与法线（用于浮力计算） */
  getWaterAt(
    x: number,
    z: number,
  ): {
    height: number;
    nx: number;
    ny: number;
    nz: number;
  } {
    const gl = this.gl;
    // 上下文丢失后回读会失败，直接返回静水，避免物理系统把 NaN 扩散出去
    if (gl.isContextLost()) {
      return { height: 0, nx: 0, ny: 1, nz: 0 };
    }
    const u = x / this.poolWidth + 0.5;
    const v = z / this.poolLength + 0.5;
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));
    const px = Math.floor(clampedU * (this.textureA.width - 1));
    const py = Math.floor(clampedV * (this.textureA.height - 1));

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureA.fbo);
    let data: Float32Array | null = null;

    if (this.textureA.type === gl.FLOAT) {
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.FLOAT, this.readFloat);
      data = this.readFloat;
    } else {
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.HALF_FLOAT, this.readHalf);
      data = new Float32Array([
        halfToFloat(this.readHalf[0]),
        halfToFloat(this.readHalf[1]),
        halfToFloat(this.readHalf[2]),
        halfToFloat(this.readHalf[3]),
      ]);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const height = data[0];
    const nx = data[2];
    const nz = data[3];
    let ny = 1.0;
    const xzSq = nx * nx + nz * nz;
    if (xzSq < 1.0) {
      ny = Math.sqrt(1.0 - xzSq);
    }
    return { height, nx, ny, nz };
  }

  /**
   * 释放 GPU 资源。
   * 注意：这里刻意不调用 WEBGL_lose_context.loseContext()——那会让 canvas 永久失效，
   * 而 React StrictMode / Fast Refresh 会在同一个 <canvas> 上重新执行 effect，
   * 拿到失效上下文后所有 getExtension 都返回 null（详见 app.ts 的说明）。
   */
  dispose() {
    const gl = this.gl;
    if (gl.isContextLost()) return;

    disposeRenderTarget(gl, this.textureA);
    disposeRenderTarget(gl, this.textureB);
    disposeQuad(gl, this.quad);
    for (const pass of [this.drop, this.update, this.normal, this.sphere]) {
      gl.deleteProgram(pass.program);
    }
  }
}

/** IEEE 754 half -> float */
const halfToFloat = (h: number): number => {
  const s = (h & 0x8000) >> 15;
  const e = (h & 0x7c00) >> 10;
  const f = h & 0x03ff;
  if (e === 0) {
    return (s ? -1 : 1) * 2 ** -14 * (f / 1024);
  }
  if (e === 0x1f) {
    return f ? NaN : (s ? -1 : 1) * Infinity;
  }
  return (s ? -1 : 1) * 2 ** (e - 15) * (1 + f / 1024);
};
