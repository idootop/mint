/**
 * 原生 WebGL2 工具层：着色器编译、VAO/缓冲、纹理与 FBO。
 * 只覆盖水池渲染需要的部分，替代 three.js 的 WebGLRenderer。
 */

export interface RenderTarget {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
  depth?: WebGLRenderbuffer;
  internalFormat: number;
  format: number;
  type: number;
}

/** 属性固定绑定的位置约定 */
export const ATTRIB_POSITION = 0;
export const ATTRIB_NORMAL = 1;
export const ATTRIB_UV = 2;

/**
 * 编译并链接着色器程序。
 * 链接前用 bindAttribLocation 固定属性位置，避免依赖编译器分配。
 */
export const createProgram = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attribs: Record<string, number>,
  label = 'program',
): WebGLProgram => {
  const compile = (type: number, source: string, stage: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      const numbered = source
        .split('\n')
        .map((l, i) => `${String(i + 1).padStart(4)}| ${l}`)
        .join('\n');
      throw new Error(`[${label}] ${stage} 编译失败: ${log}\n${numbered}`);
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertexSource, 'vertex');
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource, 'fragment');
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  for (const [name, location] of Object.entries(attribs)) {
    gl.bindAttribLocation(program, location, name);
  }
  gl.linkProgram(program);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`[${label}] 链接失败: ${log}`);
  }
  return program;
};

/** 收集程序中所有 uniform 的位置 */
export const getUniforms = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): Record<string, WebGLUniformLocation | null> => {
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
  }
  return uniforms;
};

/**
 * 全屏四边形：TRIANGLE_STRIP，NDC 位置（attrib 0，vec2）+ uv（attrib 2，vec2）。
 * 同时用作水面网格（水面顶点着色器只读 aUv 构造 XZ 平面）。
 */
export const createFullscreenQuad = (gl: WebGL2RenderingContext) => {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  // 每个顶点交替：(x, y) 与 (u, v)
  const position = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const uv = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

  const positionBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(ATTRIB_POSITION);
  gl.vertexAttribPointer(ATTRIB_POSITION, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(ATTRIB_UV);
  gl.vertexAttribPointer(ATTRIB_UV, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return { vao, positionBuffer, uvBuffer, vertexCount: 4 };
};

/**
 * 细分网格平面：NDC 位置 + uv(0..1)。
 *
 * 水面与焦散都必须用细分网格，不能只用 4 个顶点的全屏四边形：
 * - 水面顶点着色器按高度场做顶点位移，只有 4 个顶点等于几乎没有几何起伏；
 * - 焦散顶点着色器在顶点阶段采样水面并投影，`dFdx/dFdy` 依赖逐顶点的
 *   `oldPos/newPos` 插值，顶点太稀会把焦散抹平成一片。
 * three.js 原版这里用的是 `PlaneGeometry(2, 2, 200, 200)`。
 */
export const createGridQuad = (gl: WebGL2RenderingContext, segments = 200) => {
  const n = segments + 1;
  const positions = new Float32Array(n * n * 2);
  const uvs = new Float32Array(n * n * 2);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 2;
      const u = x / segments;
      const v = y / segments;
      positions[i] = u * 2 - 1;
      positions[i + 1] = v * 2 - 1;
      uvs[i] = u;
      uvs[i + 1] = v;
    }
  }

  const indices = new Uint16Array(segments * segments * 6);
  let k = 0;
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * n + x;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      indices[k++] = a;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = d;
    }
  }

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(ATTRIB_POSITION);
  gl.vertexAttribPointer(ATTRIB_POSITION, 2, gl.FLOAT, false, 0, 0);

  const uvBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(ATTRIB_UV);
  gl.vertexAttribPointer(ATTRIB_UV, 2, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);

  return { vao, positionBuffer, uvBuffer, indexBuffer, count: indices.length };
};

/** 释放细分网格 */
export const disposeGridQuad = (
  gl: WebGL2RenderingContext,
  grid: ReturnType<typeof createGridQuad>,
) => {
  gl.deleteVertexArray(grid.vao);
  gl.deleteBuffer(grid.positionBuffer);
  gl.deleteBuffer(grid.uvBuffer);
  gl.deleteBuffer(grid.indexBuffer);
};

export interface Mesh {
  vao: WebGLVertexArrayObject;
  count: number;
  type: number;
  positionBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
}

/** 建立带索引的网格：位置固定使用 ATTRIB_POSITION */
export const createMesh = (
  gl: WebGL2RenderingContext,
  positions: Float32Array,
  indices: Uint16Array | Uint32Array,
): Mesh => {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(ATTRIB_POSITION);
  gl.vertexAttribPointer(ATTRIB_POSITION, 3, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);

  return {
    vao,
    positionBuffer,
    indexBuffer,
    count: indices.length,
    type: indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
  };
};

/**
 * 单位立方体（-1..1），24 顶点 / 36 索引，外表面 CCW。
 * 等价于 three 的 BoxGeometry(2, 2, 2)，只保留位置。
 */
export const createBox = (gl: WebGL2RenderingContext): Mesh => {
  const faces: number[][][] = [
    [
      [1, -1, 1],
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
    ], // +X
    [
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
    ], // -X
    [
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1],
    ], // +Y
    [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
    ], // -Y
    [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ], // +Z
    [
      [1, -1, -1],
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
    ], // -Z
  ];

  const positions: number[] = [];
  const indices: number[] = [];
  faces.forEach((face, fi) => {
    for (const v of face) positions.push(v[0], v[1], v[2]);
    const base = fi * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return createMesh(gl, new Float32Array(positions), new Uint16Array(indices));
};

export interface RenderTargetOptions {
  internalFormat: number;
  format: number;
  type: number;
  depth?: boolean;
  linear?: boolean;
}

/** 创建可渲染纹理 + FBO */
export const createRenderTarget = (
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  options: RenderTargetOptions,
): RenderTarget => {
  const {
    internalFormat,
    format,
    type,
    depth = false,
    linear = true,
  } = options;

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    internalFormat,
    width,
    height,
    0,
    format,
    type,
    null,
  );
  const filter = linear ? gl.LINEAR : gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  let depthBuffer: WebGLRenderbuffer | undefined;
  if (depth) {
    depthBuffer = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT24,
      width,
      height,
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      depthBuffer,
    );
  }

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(
      `FBO 不完整 (0x${status.toString(16)})，size=${width}x${height}`,
    );
  }

  return {
    fbo,
    texture,
    width,
    height,
    depth: depthBuffer,
    internalFormat,
    format,
    type,
  };
};

/** 原地调整 render target 尺寸 */
export const resizeRenderTarget = (
  gl: WebGL2RenderingContext,
  rt: RenderTarget,
  width: number,
  height: number,
) => {
  if (rt.width === width && rt.height === height) return;

  gl.bindTexture(gl.TEXTURE_2D, rt.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    rt.internalFormat,
    width,
    height,
    0,
    rt.format,
    rt.type,
    null,
  );

  if (rt.depth) {
    gl.bindRenderbuffer(gl.RENDERBUFFER, rt.depth);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT24,
      width,
      height,
    );
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  rt.width = width;
  rt.height = height;
};

/** 上传 2D 图片纹理 */
export const createImageTexture = (
  gl: WebGL2RenderingContext,
  source: TexImageSource,
  wrap: 'repeat' | 'clamp' = 'clamp',
  mipmap = false,
) => {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

  const wrapMode = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
  if (mipmap) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};

/** 释放 render target 占用的 GPU 资源 */
export const disposeRenderTarget = (
  gl: WebGL2RenderingContext,
  rt: RenderTarget,
) => {
  gl.deleteFramebuffer(rt.fbo);
  gl.deleteTexture(rt.texture);
  if (rt.depth) gl.deleteRenderbuffer(rt.depth);
};

/** 释放网格占用的 GPU 资源 */
export const disposeMesh = (gl: WebGL2RenderingContext, mesh: Mesh) => {
  gl.deleteVertexArray(mesh.vao);
  gl.deleteBuffer(mesh.positionBuffer);
  gl.deleteBuffer(mesh.indexBuffer);
};

/** 释放全屏四边形占用的 GPU 资源 */
export const disposeQuad = (
  gl: WebGL2RenderingContext,
  quad: ReturnType<typeof createFullscreenQuad>,
) => {
  gl.deleteVertexArray(quad.vao);
  gl.deleteBuffer(quad.positionBuffer);
  gl.deleteBuffer(quad.uvBuffer);
};

/**
 * 用真实创建一个 FBO 的方式探测某个纹理格式是否可作为渲染目标。
 * 比只看扩展是否存在更可靠——不同实现暴露的能力与规范并不总是一致。
 */
export const isRenderableFormat = (
  gl: WebGL2RenderingContext,
  internalFormat: number,
  format: number,
  type: number,
  linear: boolean,
): boolean => {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) return false;

  let ok = false;
  try {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null,
    );
    const filter = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    // 清掉探测过程可能留下的错误，避免污染后续状态判断
    while (gl.getError() !== gl.NO_ERROR) {
      /* drain */
    }
  } catch {
    ok = false;
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
  }
  return ok;
};

export interface FloatTargetConfig {
  internalFormat: number;
  format: number;
  type: number;
  /** 人类可读的格式名，用于日志 */
  label: string;
}

/**
 * 依次探测可用的浮点渲染目标格式，返回第一个真正可渲染的配置。
 * 这替代了 three.js 时期「只看 OES_texture_float_linear 就选 FloatType」的做法，
 * 避免在部分浏览器上选到不可渲染的格式后整个页面报错。
 */
export const pickFloatTargetConfig = (
  gl: WebGL2RenderingContext,
): FloatTargetConfig | null => {
  // 允许 half-float 渲染目标
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('EXT_color_buffer_half_float');
  // 允许对 32 位浮点纹理做线性过滤（水面模拟依赖线性采样）
  gl.getExtension('OES_texture_float_linear');
  // 允许混合写入浮点目标（焦散 pass 已改为不混合，仅为兼容性开启）
  gl.getExtension('EXT_float_blend');

  const candidates: FloatTargetConfig[] = [
    {
      label: 'RGBA32F/FLOAT',
      internalFormat: gl.RGBA32F,
      format: gl.RGBA,
      type: gl.FLOAT,
    },
    {
      label: 'RGBA16F/HALF_FLOAT',
      internalFormat: gl.RGBA16F,
      format: gl.RGBA,
      type: gl.HALF_FLOAT,
    },
    {
      label: 'R11F_G11F_B10F/HALF_FLOAT',
      internalFormat: gl.R11F_G11F_B10F,
      format: gl.RGB,
      type: gl.HALF_FLOAT,
    },
  ];

  for (const candidate of candidates) {
    // 32 位浮点还需要线性过滤支持，否则水面采样会退化成 NEAREST
    if (
      candidate.type === gl.FLOAT &&
      !gl.getExtension('OES_texture_float_linear')
    ) {
      continue;
    }
    if (
      isRenderableFormat(
        gl,
        candidate.internalFormat,
        candidate.format,
        candidate.type,
        true,
      )
    ) {
      return candidate;
    }
  }
  return null;
};
