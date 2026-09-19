// biome-ignore-all lint/correctness/useHookAtTopLevel: gl.useProgram 是 WebGL API，与 React Hook 无关
import {
  causticsFragmentShader,
  causticsVertexShader,
} from '../shaders/caustics';
import { sceneVertexShader } from '../shaders/common';
import { duckFragmentShader, duckVertexShader } from '../shaders/duck';
import {
  cubeFragmentShader,
  waterFragmentShader,
  waterVertexShader,
} from '../shaders/water';
import {
  ATTRIB_NORMAL,
  ATTRIB_POSITION,
  ATTRIB_UV,
  createBox,
  createFullscreenQuad,
  createGridQuad,
  createImageTexture,
  createProgram,
  createRenderTarget,
  disposeGridQuad,
  disposeMesh,
  disposeQuad,
  disposeRenderTarget,
  getUniforms,
  type Mesh,
  type RenderTarget,
  resizeRenderTarget,
} from './gl-utils';
import type { DuckMesh } from './gltf';
import { mat4Compose, mat4Multiply, Quat, Vec3 } from './math';
import {
  TEX_UNIT_CAUSTICS,
  TEX_UNIT_DUCK_REFRACTION,
  TEX_UNIT_DUCK_TEX,
  TEX_UNIT_SKY,
  TEX_UNIT_TILES,
  TEX_UNIT_WATER,
  type WaterSimulation,
} from './water';

const CAUSTIC_SIZE = 1024;

interface Pass {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface Camera {
  view: Float32Array;
  proj: Float32Array;
  position: Vec3;
}

/**
 * 水池场景渲染器：水面、池壁、焦散、鸭子折射。
 * 对应 three.js 时期的 core/Renderer.ts。
 */
export class PoolRenderer {
  private gl: WebGL2RenderingContext;
  private quad: ReturnType<typeof createFullscreenQuad>;
  /** 水面 / 焦散用的细分网格（对应原版 PlaneGeometry(2,2,200,200)） */
  private grid: ReturnType<typeof createGridQuad>;
  private box: Mesh;

  private waterPass: Pass;
  private cubePass: Pass;
  private causticsPass: Pass;
  private duckPass: Pass;

  causticTex: RenderTarget;
  duckRefractionTex: RenderTarget;

  tileTexture: WebGLTexture;
  skyTexture: WebGLTexture;

  duck: DuckMesh | null = null;

  // 水池尺寸
  poolWidth = 2;
  poolLength = 2;
  poolHeight = 2;
  wallHeight = 1;

  // 鸭子（球体）状态
  sphereCenter = new Vec3();
  sphereRadius = 0.25;
  duckPosition = new Vec3();
  duckQuaternion = new Quat();
  lightDir = new Vec3(-1, 1, 1).normalize();

  private duckBase: Float32Array | null = null;
  private tr = new Float32Array(16);
  private model = new Float32Array(16);

  constructor(
    gl: WebGL2RenderingContext,
    causticInternalFormat: number,
    causticType: number,
    tiles: TexImageSource,
    sky: TexImageSource,
  ) {
    this.gl = gl;
    this.quad = createFullscreenQuad(gl);
    this.grid = createGridQuad(gl, 200);
    this.box = createBox(gl);

    const quadAttribs = { aPosition: ATTRIB_POSITION, aUv: ATTRIB_UV };
    const sceneAttribs = { aPosition: ATTRIB_POSITION };

    this.waterPass = this.makePass(
      waterVertexShader,
      waterFragmentShader,
      quadAttribs,
      'pool.water',
    );
    this.cubePass = this.makePass(
      sceneVertexShader,
      cubeFragmentShader,
      sceneAttribs,
      'pool.cube',
    );
    this.causticsPass = this.makePass(
      causticsVertexShader,
      causticsFragmentShader,
      sceneAttribs,
      'pool.caustics',
    );
    this.duckPass = this.makePass(
      duckVertexShader,
      duckFragmentShader,
      { aPosition: ATTRIB_POSITION, aNormal: ATTRIB_NORMAL, aUv: ATTRIB_UV },
      'pool.duck',
    );

    this.causticTex = createRenderTarget(gl, CAUSTIC_SIZE, CAUSTIC_SIZE, {
      internalFormat: causticInternalFormat,
      format: gl.RGBA,
      type: causticType,
      linear: true,
    });

    this.duckRefractionTex = createRenderTarget(gl, 1, 1, {
      internalFormat: gl.RGBA8,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      depth: true,
      linear: true,
    });

    this.tileTexture = createImageTexture(gl, tiles, 'repeat', true);
    this.skyTexture = createImageTexture(gl, sky, 'clamp', false);
  }

  private makePass(
    vs: string,
    fs: string,
    attribs: Record<string, number>,
    label: string,
  ): Pass {
    const program = createProgram(this.gl, vs, fs, attribs, label);
    return { program, uniforms: getUniforms(this.gl, program) };
  }

  setDuck(duck: DuckMesh) {
    this.duck = duck;
    // base = S(fitScale) * nodeMatrix
    // 注意：只能缩放左上 3x3 与平移分量，[15] 必须保持 1
    const s = duck.fitScale;
    const scaleMatrix = new Float32Array([
      s,
      0,
      0,
      0,
      0,
      s,
      0,
      0,
      0,
      0,
      s,
      0,
      0,
      0,
      0,
      1,
    ]);
    this.duckBase = mat4Multiply(
      scaleMatrix,
      duck.nodeMatrix,
      new Float32Array(16),
    );
  }

  updateDimensions(w: number, l: number, d: number, wh: number) {
    this.poolWidth = w;
    this.poolLength = l;
    this.poolHeight = d;
    this.wallHeight = wh;
  }

  /** 绑定通用 uniform（几何尺寸 / 光照 / 贴图） */
  private bindCommon(pass: Pass, waterSim: WaterSimulation) {
    const gl = this.gl;
    const u = pass.uniforms;

    gl.uniform1f(u.poolHeight, this.poolHeight);
    gl.uniform1f(u.wallHeight, this.wallHeight);
    gl.uniform2f(u.poolSize, this.poolWidth / 2, this.poolLength / 2);
    gl.uniform3f(u.light, this.lightDir.x, this.lightDir.y, this.lightDir.z);
    gl.uniform3f(
      u.sphereCenter,
      this.sphereCenter.x,
      this.sphereCenter.y,
      this.sphereCenter.z,
    );
    gl.uniform1f(u.sphereRadius, this.sphereRadius);

    gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_WATER);
    gl.bindTexture(gl.TEXTURE_2D, waterSim.textureA.texture);
    gl.uniform1i(u.water, TEX_UNIT_WATER);

    gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_TILES);
    gl.bindTexture(gl.TEXTURE_2D, this.tileTexture);
    gl.uniform1i(u.tiles, TEX_UNIT_TILES);

    gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_CAUSTICS);
    gl.bindTexture(gl.TEXTURE_2D, this.causticTex.texture);
    gl.uniform1i(u.causticTex, TEX_UNIT_CAUSTICS);
  }

  /** 把水面折射光投影到池底，生成焦散与鸭子阴影贴图 */
  updateCaustics(waterSim: WaterSimulation) {
    const gl = this.gl;
    const pass = this.causticsPass;

    gl.bindVertexArray(this.grid.vao);
    gl.useProgram(pass.program);
    // poolSize 由 bindCommon 统一设为「半尺寸」(w/2, l/2)，与原版
    // Renderer.updateDimensions 给四个材质赋的值一致；这里不要再覆盖成整尺寸，
    // 否则焦散的投影会被缩小一半、池底亮度也随之偏亮。
    this.bindCommon(pass, waterSim);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.causticTex.fbo);
    gl.viewport(0, 0, this.causticTex.width, this.causticTex.height);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, this.grid.count, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
  }

  /**
   * 鸭子网格的视觉中心（世界坐标）。
   *
   * GLB 的网格原点并不在鸭子几何中心上（节点链带有平移，实测偏离物理球心约 0.17）。
   * 鼠标拾取必须用这个中心，否则点鸭子身体上半部分会打空、落到水面上变成「加水滴」，
   * 溅起的水花会把鸭子瞬间弹开——看起来就像点击后鸭子错位了。
   */
  getDuckVisualCenter(out = new Vec3()): Vec3 {
    if (!this.duck) return out.copy(this.duckPosition);
    const local = this.duck.center.clone().multiplyScalar(this.duck.fitScale);
    local.applyQuaternion(this.duckQuaternion);
    return out.copy(this.duckPosition).add(local);
  }

  /** 鸭子的视觉半径 */
  get duckVisualRadius(): number {
    return this.duck?.visualRadius ?? this.physicsFallbackRadius;
  }

  private physicsFallbackRadius = 0.25;

  /** 绑定鸭子着色器与 uniform（不改动 framebuffer / 深度状态） */
  private bindDuck(camera: Camera, waterSim: WaterSimulation) {
    const gl = this.gl;
    const duck = this.duck!;
    const pass = this.duckPass;

    gl.useProgram(pass.program);

    // model = T(duckPosition) * R(quat) * base
    mat4Compose(this.duckPosition, this.duckQuaternion, 1, this.tr);
    mat4Multiply(this.tr, this.duckBase!, this.model);

    gl.uniformMatrix4fv(pass.uniforms.uModel, false, this.model);
    gl.uniformMatrix4fv(pass.uniforms.uView, false, camera.view);
    gl.uniformMatrix4fv(pass.uniforms.uProj, false, camera.proj);
    gl.uniform3f(
      pass.uniforms.lightDir,
      this.lightDir.x,
      this.lightDir.y,
      this.lightDir.z,
    );

    // 水下判定需要水面高度场；poolSize 用半尺寸，与水面 shader 的换算保持一致
    gl.uniform2f(
      pass.uniforms.poolSize,
      this.poolWidth / 2,
      this.poolLength / 2,
    );
    gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_WATER);
    gl.bindTexture(gl.TEXTURE_2D, waterSim.textureA.texture);
    gl.uniform1i(pass.uniforms.water, TEX_UNIT_WATER);

    gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_DUCK_TEX);
    gl.bindTexture(gl.TEXTURE_2D, duck.texture);
    gl.uniform1i(pass.uniforms.duckTex, TEX_UNIT_DUCK_TEX);

    gl.bindVertexArray(duck.vao);
    gl.drawElements(
      gl.TRIANGLES,
      duck.count,
      duck.indexType,
      duck.indexByteOffset,
    );
    gl.bindVertexArray(null);
  }

  /**
   * 从主相机视角把鸭子渲染到离屏纹理，供水面做屏幕空间折射。
   * 注意：这只是「透过水面看到的鸭子」，鸭子本体还需要在主 framebuffer 里
   * 以不透明物体再画一次（见 drawDuckOpaque），否则整只鸭子看起来都在水下。
   */
  private renderDuckRefraction(camera: Camera, waterSim: WaterSimulation) {
    const duck = this.duck;
    if (!duck || !this.duckBase) return;

    const gl = this.gl;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    resizeRenderTarget(gl, this.duckRefractionTex, width, height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.duckRefractionTex.fbo);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.bindDuck(camera, waterSim);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * 在主 framebuffer 里把鸭子作为不透明物体绘制。
   * 对应 three.js 时期 duckMesh 挂在 scene 上、随主 pass 一起渲染的行为：
   * 水面是 transparent，所以鸭子先画、水面后画，露出水面的部分才不会被水盖住。
   */
  private drawDuckOpaque(camera: Camera, waterSim: WaterSimulation) {
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.BLEND);
    this.bindDuck(camera, waterSim);
  }

  /** 主渲染：池壁（背面）+ 水面 */
  render(waterSim: WaterSimulation, camera: Camera) {
    const gl = this.gl;

    if (this.duck) {
      this.renderDuckRefraction(camera, waterSim);
    }

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- 池壁 / 池底（渲染背面，看到盒子内部）---
    {
      const pass = this.cubePass;
      gl.useProgram(pass.program);
      this.bindCommon(pass, waterSim);

      const height2 = this.poolHeight + this.wallHeight;
      mat4Compose(
        new Vec3(0, (this.wallHeight - this.poolHeight) / 2, 0),
        new Quat(),
        new Vec3(
          this.poolWidth / 2,
          Math.max(height2 / 2, 0.01),
          this.poolLength / 2,
        ),
        this.model,
      );
      gl.uniformMatrix4fv(pass.uniforms.uModel, false, this.model);
      gl.uniformMatrix4fv(pass.uniforms.uView, false, camera.view);
      gl.uniformMatrix4fv(pass.uniforms.uProj, false, camera.proj);

      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
      gl.bindVertexArray(this.box.vao);
      gl.drawElements(gl.TRIANGLES, this.box.count, this.box.type, 0);
      gl.bindVertexArray(null);
    }

    // --- 鸭子本体（不透明，先于透明的水面绘制）---
    // three.js 时期 duckMesh 挂在 scene 上，主 pass 会把它一起画出来；
    // 只画折射纹理的话，鸭子就只存在于「水里」，看起来整只都在水下。
    if (this.duck && this.duckBase) {
      this.drawDuckOpaque(camera, waterSim);
    }

    // --- 水面（读高度贴图做顶点位移）---
    {
      const pass = this.waterPass;
      gl.useProgram(pass.program);
      this.bindCommon(pass, waterSim);

      gl.uniform3f(
        pass.uniforms.eye,
        camera.position.x,
        camera.position.y,
        camera.position.z,
      );
      gl.uniform2f(pass.uniforms.resolution, width, height);

      gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_SKY);
      gl.bindTexture(gl.TEXTURE_2D, this.skyTexture);
      gl.uniform1i(pass.uniforms.sky, TEX_UNIT_SKY);

      gl.activeTexture(gl.TEXTURE0 + TEX_UNIT_DUCK_REFRACTION);
      gl.bindTexture(gl.TEXTURE_2D, this.duckRefractionTex.texture);
      gl.uniform1i(pass.uniforms.duckRefraction, TEX_UNIT_DUCK_REFRACTION);

      mat4Compose(
        new Vec3(0, 0, 0),
        new Quat(),
        new Vec3(this.poolWidth / 2, 1, this.poolLength / 2),
        this.model,
      );
      gl.uniformMatrix4fv(pass.uniforms.uModel, false, this.model);
      gl.uniformMatrix4fv(pass.uniforms.uView, false, camera.view);
      gl.uniformMatrix4fv(pass.uniforms.uProj, false, camera.proj);

      gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(this.grid.vao);
      gl.drawElements(gl.TRIANGLES, this.grid.count, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
  }

  /** 释放 GPU 资源（不销毁上下文，见 app.ts 的说明） */
  dispose() {
    const gl = this.gl;
    if (gl.isContextLost()) return;

    disposeRenderTarget(gl, this.causticTex);
    disposeRenderTarget(gl, this.duckRefractionTex);
    disposeQuad(gl, this.quad);
    disposeGridQuad(gl, this.grid);
    disposeMesh(gl, this.box);
    gl.deleteTexture(this.tileTexture);
    gl.deleteTexture(this.skyTexture);

    for (const pass of [
      this.waterPass,
      this.cubePass,
      this.causticsPass,
      this.duckPass,
    ]) {
      gl.deleteProgram(pass.program);
    }

    if (this.duck) {
      gl.deleteVertexArray(this.duck.vao);
      for (const buffer of this.duck.buffers) gl.deleteBuffer(buffer);
      gl.deleteTexture(this.duck.texture);
      this.duck = null;
    }
  }
}
