import {
  ATTRIB_NORMAL,
  ATTRIB_POSITION,
  ATTRIB_UV,
  createImageTexture,
} from './gl-utils';
import { mat4Compose, mat4Identity, mat4Multiply, Quat, Vec3 } from './math';

/**
 * 极简 glTF 2.0 / GLB 解析器。
 *
 * 只覆盖本项目鸭子模型用到的子集：单个 buffer(0) 的 GLB、TRS 节点链、
 * 交错或紧凑的顶点缓冲、KHR_mesh_quantization（归一化整型顶点属性）、
 * EXT_texture_webp 内嵌贴图。
 */

const COMPONENT_TYPE: Record<
  number,
  { gl: number; bytes: number; vec: string }
> = {
  5120: { gl: 0x1400, bytes: 1, vec: 'BYTE' },
  5121: { gl: 0x1401, bytes: 1, vec: 'UNSIGNED_BYTE' },
  5122: { gl: 0x1402, bytes: 2, vec: 'SHORT' },
  5123: { gl: 0x1403, bytes: 2, vec: 'UNSIGNED_SHORT' },
  5125: { gl: 0x1405, bytes: 4, vec: 'UNSIGNED_INT' },
  5126: { gl: 0x1406, bytes: 4, vec: 'FLOAT' },
};

const NUM_COMPONENTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
};

export interface GltfAttribute {
  location: number;
  size: number;
  type: number;
  normalized: boolean;
  stride: number;
  byteOffset: number;
}

export interface DuckMesh {
  vao: WebGLVertexArrayObject;
  /** 顶点与索引 buffer，供释放时使用 */
  buffers: WebGLBuffer[];
  /** 顶点索引数量 */
  count: number;
  /** 索引类型（gl.UNSIGNED_SHORT / gl.UNSIGNED_INT） */
  indexType: number;
  /** 索引在 ELEMENT_ARRAY_BUFFER 中的字节偏移 */
  indexByteOffset: number;
  /** 网格节点链的局部变换矩阵（未含等比缩放/物理位姿） */
  nodeMatrix: Float32Array;
  /** 让模型最长边等于 targetSize 的等比缩放 */
  fitScale: number;
  /** 视觉半径（= targetSize / 2），用于鼠标拾取时与可见模型对齐 */
  visualRadius: number;
  /** 模型中心（节点空间），用于把鸭子视觉中心对齐到物理球心 */
  center: Vec3;
  texture: WebGLTexture;
}

interface GltfDoc {
  json: any;
  bin: Uint8Array;
}

/**
 * 解析 GLB 容器，返回 JSON 与 BIN 块。
 *
 * 所有读取都先做边界检查：网络中断、代理/CDN 截断、缓存损坏都可能拿到
 * 不完整（甚至 0 字节）的响应，直接 getUint32 会抛 RangeError 把整页搞黑。
 */
const parseGlb = (buffer: ArrayBuffer): GltfDoc => {
  const byteLength = buffer.byteLength;
  if (byteLength < 12) {
    throw new Error(`GLB 数据不完整（只有 ${byteLength} 字节）`);
  }

  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546c67) {
    throw new Error('不是合法的 GLB 文件');
  }
  const version = view.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`不支持的 glTF 版本: ${version}`);
  }

  // 容器自报的总长度，用来识别被截断的响应
  const declaredLength = view.getUint32(8, true);
  const total = Math.min(declaredLength, byteLength);
  if (total !== declaredLength) {
    throw new Error(
      `GLB 数据被截断（声明 ${declaredLength} 字节，实际 ${byteLength} 字节）`,
    );
  }

  let offset = 12;
  let json: any = null;
  let bin: Uint8Array = new Uint8Array(0);

  while (offset + 8 <= total) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    if (chunkStart + chunkLength > total) {
      throw new Error('GLB 数据块越界，文件可能已损坏');
    }
    if (chunkType === 0x4e4f534a) {
      const text = new TextDecoder().decode(
        new Uint8Array(buffer, chunkStart, chunkLength),
      );
      json = JSON.parse(text);
    } else if (chunkType === 0x004e4942) {
      bin = new Uint8Array(buffer, chunkStart, chunkLength);
    }
    offset = chunkStart + chunkLength;
  }

  if (!json) throw new Error('GLB 缺少 JSON 块');
  return { json, bin };
};

/** 节点 TRS -> 矩阵 */
const nodeMatrix = (node: any): Float32Array => {
  if (Array.isArray(node.matrix)) {
    return new Float32Array(node.matrix);
  }
  const t = node.translation ?? [0, 0, 0];
  const r = node.rotation ?? [0, 0, 0, 1];
  const s = node.scale ?? [1, 1, 1];
  return mat4Compose(
    new Vec3(t[0], t[1], t[2]),
    new Quat(r[0], r[1], r[2], r[3]),
    new Vec3(s[0], s[1], s[2]),
  );
};

/** 找到第一个带 mesh 的节点，并累乘其从场景根到该节点的变换 */
const findMeshNode = (
  json: any,
): { meshIndex: number; matrix: Float32Array } | null => {
  const nodes: any[] = json.nodes ?? [];
  const scene = json.scenes?.[json.scene ?? 0];
  const roots: number[] = scene?.nodes ?? [];

  const visit = (
    index: number,
    parent: Float32Array,
  ): { meshIndex: number; matrix: Float32Array } | null => {
    const node = nodes[index];
    if (!node) return null;
    const local = mat4Multiply(parent, nodeMatrix(node), new Float32Array(16));
    if (node.mesh !== undefined) {
      return { meshIndex: node.mesh, matrix: local };
    }
    for (const child of node.children ?? []) {
      const found = visit(child, local);
      if (found) return found;
    }
    return null;
  };

  for (const root of roots) {
    const found = visit(root, mat4Identity());
    if (found) return found;
  }
  // 兜底：没有 scene 定义时直接遍历所有节点
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]?.mesh !== undefined) {
      return { meshIndex: nodes[i].mesh, matrix: nodeMatrix(nodes[i]) };
    }
  }
  return null;
};

/** 读取 accessor 的全部数据（用于 CPU 侧计算包围盒） */
export const readAccessor = (doc: GltfDoc, accessorIndex: number): number[] => {
  const { json, bin } = doc;
  const accessor = json.accessors[accessorIndex];
  const bufferView = json.bufferViews[accessor.bufferView];
  const component = COMPONENT_TYPE[accessor.componentType];
  const numComponents = NUM_COMPONENTS[accessor.type];
  const baseOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = bufferView.byteStride ?? component.bytes * numComponents;

  const dataView = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const out: number[] = [];
  const scale = accessor.normalized
    ? {
        5120: 1 / 127,
        5121: 1 / 255,
        5122: 1 / 32767,
        5123: 1 / 65535,
        5125: 1 / 4294967295,
        5126: 1,
      }[accessor.componentType as number]!
    : 1;

  for (let i = 0; i < accessor.count; i++) {
    const vertexOffset = baseOffset + i * stride;
    for (let c = 0; c < numComponents; c++) {
      const o = vertexOffset + c * component.bytes;
      let value: number;
      switch (accessor.componentType) {
        case 5120:
          value = dataView.getInt8(o);
          break;
        case 5121:
          value = dataView.getUint8(o);
          break;
        case 5122:
          value = dataView.getInt16(o, true);
          break;
        case 5123:
          value = dataView.getUint16(o, true);
          break;
        case 5125:
          value = dataView.getUint32(o, true);
          break;
        default:
          value = dataView.getFloat32(o, true);
      }
      out.push(accessor.normalized ? value * scale : value);
    }
  }
  return out;
};

/** 定位 baseColorTexture 对应的内嵌图片 */
const findBaseColorImage = (
  json: any,
): { bufferView: number; mimeType: string } | null => {
  const material = json.materials?.[0];
  const textureIndex =
    material?.pbrMetallicRoughness?.baseColorTexture?.index ?? 0;
  const texture = json.textures?.[textureIndex];
  if (!texture) return null;
  const source =
    texture.extensions?.EXT_texture_webp?.source ?? texture.source ?? 0;
  const image = json.images?.[source];
  if (!image?.bufferView && image?.bufferView !== 0) return null;
  return {
    bufferView: image.bufferView,
    mimeType: image.mimeType ?? 'image/png',
  };
};

/**
 * 从 GLB 数据构建可直接绘制的鸭子网格。
 * @param targetSize 归一化后模型最长边的世界尺寸
 */
export const loadDuck = async (
  gl: WebGL2RenderingContext,
  buffer: ArrayBuffer,
  targetSize: number,
): Promise<DuckMesh> => {
  const doc = parseGlb(buffer);
  const { json, bin } = doc;

  const found = findMeshNode(json);
  if (!found) throw new Error('GLB 中没有找到网格节点');

  const mesh = json.meshes[found.meshIndex];
  const primitive = mesh.primitives[0];
  const attributes = primitive.attributes as Record<string, number>;

  const positionAccessor = json.accessors[attributes.POSITION];
  const nodeMat = found.matrix;

  // --- 计算节点变换后的包围盒 ---
  const rawPositions = readAccessor(doc, attributes.POSITION);
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  const vertex = new Vec3();
  for (let i = 0; i < positionAccessor.count; i++) {
    const x = rawPositions[i * 3];
    const y = rawPositions[i * 3 + 1];
    const z = rawPositions[i * 3 + 2];
    vertex.set(
      nodeMat[0] * x + nodeMat[4] * y + nodeMat[8] * z + nodeMat[12],
      nodeMat[1] * x + nodeMat[5] * y + nodeMat[9] * z + nodeMat[13],
      nodeMat[2] * x + nodeMat[6] * y + nodeMat[10] * z + nodeMat[14],
    );
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    minZ = Math.min(minZ, vertex.z);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
    maxZ = Math.max(maxZ, vertex.z);
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeY, sizeZ) || 1;
  const fitScale = targetSize / maxDim;
  const center = new Vec3(
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  );

  // --- 建立 VAO ---
  // 注意：WebGL 不允许同一个 buffer 同时绑定到 ARRAY_BUFFER 与 ELEMENT_ARRAY_BUFFER，
  // 因此顶点数据与索引必须使用两个独立的 buffer。
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const vertexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, bin, gl.STATIC_DRAW);

  const setupAttribute = (accessorIndex: number, location: number) => {
    const accessor = json.accessors[accessorIndex];
    const bufferView = json.bufferViews[accessor.bufferView];
    const component = COMPONENT_TYPE[accessor.componentType];
    const numComponents = NUM_COMPONENTS[accessor.type];
    const byteOffset =
      (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const stride = bufferView.byteStride ?? 0;

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(
      location,
      numComponents,
      component.gl,
      !!accessor.normalized,
      stride,
      byteOffset,
    );
  };

  setupAttribute(attributes.POSITION, ATTRIB_POSITION);
  if (attributes.NORMAL !== undefined) {
    setupAttribute(attributes.NORMAL, ATTRIB_NORMAL);
  }
  if (attributes.TEXCOORD_0 !== undefined) {
    setupAttribute(attributes.TEXCOORD_0, ATTRIB_UV);
  }

  const indexAccessor = json.accessors[primitive.indices];
  const indexBufferView = json.bufferViews[indexAccessor.bufferView];
  const indexComponent = COMPONENT_TYPE[indexAccessor.componentType];
  const indexByteOffset =
    (indexBufferView.byteOffset ?? 0) + (indexAccessor.byteOffset ?? 0);
  const indexByteLength = indexAccessor.count * indexComponent.bytes;

  const indexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    bin.slice(indexByteOffset, indexByteOffset + indexByteLength),
    gl.STATIC_DRAW,
  );

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // --- 贴图 ---
  const image = findBaseColorImage(json);
  if (!image) throw new Error('鸭子模型缺少 baseColorTexture');

  const bufferView = json.bufferViews[image.bufferView];
  const imageStart = bin.byteOffset + (bufferView.byteOffset ?? 0);
  // 复制出自己的 ArrayBuffer，避免与 BIN 块共享底层缓冲
  const imageBytes = new Uint8Array(
    (bin.buffer as ArrayBuffer).slice(
      imageStart,
      imageStart + bufferView.byteLength,
    ),
  );
  const blob = new Blob([imageBytes], { type: image.mimeType });
  const bitmap = await createImageBitmap(blob);
  const texture = createImageTexture(gl, bitmap, 'repeat', true);

  return {
    vao,
    buffers: [vertexBuffer, indexBuffer],
    count: indexAccessor.count,
    indexType: indexComponent.gl,
    // 索引已单独上传为独立 buffer，绘制时偏移为 0
    indexByteOffset: 0,
    nodeMatrix: nodeMat,
    fitScale,
    visualRadius: targetSize / 2,
    center,
    texture,
  };
};
