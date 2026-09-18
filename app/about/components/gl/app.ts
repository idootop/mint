import { pickFloatTargetConfig } from './gl-utils';
import { loadDuck } from './gltf';
import { InputManager } from './input';
import { mat4LookAt, mat4MakeBasis, mat4Perspective, Quat, Vec3 } from './math';
import { PhysicsEngine } from './physics';
import { type Camera, PoolRenderer } from './renderer';
import { WaterSimulation } from './water';

/**
 * 视觉上把鸭子往下压的距离，与原版 three.js 保持一致（原版为 0.1）。
 *
 * 不要为了「让鸭子看起来更沉」而调大它：鸭子在水面以下的体积会同时体现在
 * 折射纹理里，压得越深，折射出来的那张「水下鸭子」越大越暗，而它是按水面法线
 * 偏移采样的，会和主 pass 里不透明的那只错开，形成两个鸭子轮廓。
 * 保持浅吃水时折射项基本是亮的，和本体叠在一起，只留下边缘一圈水下暗边。
 */
const kDuckSinkOffset = 0.1;

export interface ApplicationOptions {
  /** 鸭子模型（GLB）URL */
  duckModel: string;
  /** 瓷砖贴图 URL */
  tiles: string;
  /** 天空贴图 URL */
  sky: string;
  canvas: HTMLCanvasElement;
}

export class Application {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;

  camera: Camera;
  water?: WaterSimulation;
  renderer?: PoolRenderer;
  physics = new PhysicsEngine();
  inputManager?: InputManager;

  // 配置
  containerHeight = 1.4;
  waterFillRatio = 0.7;
  dist = 4;

  private duckUrl: string;
  private tilesUrl: string;
  private skyUrl: string;

  private animationFrameId: number | null = null;
  private disposed = false;
  private listeners: Array<() => void> = [];

  constructor({ duckModel, tiles, sky, canvas }: ApplicationOptions) {
    this.canvas = canvas;
    this.duckUrl = duckModel;
    this.tilesUrl = tiles;
    this.skyUrl = sky;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      depth: true,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      throw new Error('当前浏览器不支持 WebGL2');
    }
    this.gl = gl;

    this.camera = {
      view: new Float32Array(16),
      proj: new Float32Array(16),
      position: new Vec3(0, 4, 0),
    };

    // 上下文丢失时停帧；恢复后整条管线需要重建，直接跳过（页面保留黑底背景）
    const onLost = (event: Event) => {
      event.preventDefault();
      this.disposed = true;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    };
    canvas.addEventListener('webglcontextlost', onLost, false);
    this.listeners.push(() =>
      canvas.removeEventListener('webglcontextlost', onLost),
    );
  }

  /**
   * 加载资源并建立渲染管线。
   * 返回 false 表示当前环境不支持（不抛异常，页面降级为纯色背景）。
   */
  async init(): Promise<boolean> {
    const gl = this.gl;

    // 上下文可能在别处被销毁过（例如上一次 effect 清理时调用了 loseContext），
    // 此时拿到的仍是同一个已失效的上下文，所有 getExtension 都会返回 null。
    // 必须在这里显式识别，否则会被误判成「不支持浮点纹理」。
    if (gl.isContextLost()) {
      console.warn('[PoolDuck] WebGL 上下文已失效，跳过 3D 背景');
      return false;
    }

    // --- 浮点渲染目标能力探测 ---
    // 用真实建 FBO 的方式探测，而不是只判断扩展是否存在：
    // 不同浏览器/驱动暴露的扩展与规范并不总是一致，探测结果更可靠。
    const floatConfig = pickFloatTargetConfig(gl);
    if (!floatConfig) {
      console.warn('[PoolDuck] 当前环境不支持可渲染的浮点纹理，跳过 3D 背景');
      return false;
    }

    const { internalFormat, type } = floatConfig;

    // --- 并行拉取全部资源 ---
    // 鸭子加载失败不应让整页变黑：拿不到就退化成「只有水池没有鸭子」。
    const duckPromise = fetchWithRetry(this.duckUrl)
      .then((buffer) => loadDuck(gl, buffer, 0.5))
      .catch((error) => {
        console.warn('[PoolDuck] 鸭子模型加载失败，仅渲染水池:', error);
        return null;
      });

    const [tilesBitmap, skyBitmap, duck] = await Promise.all([
      fetchBitmap(this.tilesUrl),
      fetchBitmap(this.skyUrl),
      duckPromise,
    ]);

    // 异步等待期间可能已被卸载 / 上下文已丢失
    if (this.disposed || gl.isContextLost()) return false;

    // --- 构建模拟与渲染器 ---
    this.water = new WaterSimulation(gl, internalFormat, type);
    this.renderer = new PoolRenderer(
      gl,
      internalFormat,
      type,
      tilesBitmap,
      skyBitmap,
    );

    if (duck) this.renderer.setDuck(duck);

    this.inputManager = new InputManager(() => this.camera, this.canvas);
    this.setupEvents();

    this.updatePoolDimensions();
    this.onResize();

    // 拾取要用鸭子「看得见」的位置：GLB 网格原点偏离物理球心约 0.17，
    // 用物理球心做命中判定会导致点鸭子身体上半部分打空、误加水滴把鸭子弹开。
    // 半径给一点容差，鸭子是不规则形状，按外接球半径会有点难点中。
    this.inputManager.getContext = () => ({
      center: this.renderer
        ? this.renderer.getDuckVisualCenter()
        : this.physics.center,
      radius: this.renderer
        ? this.renderer.duckVisualRadius * 1.25
        : this.physics.radius,
      poolWidth: this.physics.poolWidth,
      poolLength: this.physics.poolLength,
    });

    this.initWaterDrops();
    return true;
  }

  private setupEvents() {
    const input = this.inputManager;
    if (!input) return;

    input.onAddDrop = (x, z) => {
      this.water?.addDrop(x, z, 0.03, 0.02);
    };

    input.onMoveSphere = (delta) => {
      this.physics.center.add(delta);
      this.physics.center.x = Math.max(
        this.physics.radius - this.physics.poolWidth / 2,
        Math.min(
          this.physics.poolWidth / 2 - this.physics.radius,
          this.physics.center.x,
        ),
      );
      this.physics.center.y = Math.max(
        this.physics.radius - this.physics.poolDepth,
        Math.min(10, this.physics.center.y),
      );
      this.physics.center.z = Math.max(
        this.physics.radius - this.physics.poolLength / 2,
        Math.min(
          this.physics.poolLength / 2 - this.physics.radius,
          this.physics.center.z,
        ),
      );
    };

    window.addEventListener('resize', this.onResizeBound);
    this.listeners.push(() =>
      window.removeEventListener('resize', this.onResizeBound),
    );
  }

  private cleanupEvents() {
    for (const off of this.listeners) off();
    this.listeners = [];
  }

  private onResizeBound = () => this.onResize();

  private initWaterDrops() {
    for (let i = 0; i < 20; i++) {
      this.water?.addDrop(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        0.03,
        i & 1 ? 0.01 : -0.01,
      );
    }
  }

  private updatePoolDimensions() {
    const waterDepth = this.containerHeight * this.waterFillRatio;
    const wallHeight = this.containerHeight * (1 - this.waterFillRatio);

    this.physics.poolDepth = waterDepth;
    this.renderer?.updateDimensions(
      this.physics.poolWidth,
      this.physics.poolLength,
      waterDepth,
      wallHeight,
    );
    this.water?.updateDimensions(
      this.physics.poolWidth,
      this.physics.poolLength,
    );
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));

    const aspect = width / height;
    this.camera.proj = mat4Perspective(45, aspect, 0.01, 100);

    // 水池自动铺满可视区域（俯视）
    const visibleHeight = 2 * this.dist * Math.tan((45 * Math.PI) / 360);
    const visibleWidth = visibleHeight * aspect;

    this.physics.poolWidth = visibleWidth;
    this.physics.poolLength = visibleHeight;
    this.updatePoolDimensions();
  }

  start() {
    let prevTime = performance.now();
    const animate = () => {
      if (this.disposed) return;
      const nextTime = performance.now();
      this.update((nextTime - prevTime) / 1000);
      this.draw();
      prevTime = nextTime;
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 停止渲染并释放 GPU 资源。
   *
   * 这里**故意不调用** `WEBGL_lose_context.loseContext()`：
   * canvas 的 WebGL 上下文是按元素缓存的，loseContext 之后再对它调用
   * `getContext('webgl2')` 拿到的仍是同一个**已失效**的上下文对象，
   * 而失效上下文上的 `getExtension()` 一律返回 null。
   * React StrictMode / Fast Refresh 会在同一个 <canvas> 上重新执行 effect，
   * 于是第二次初始化就会把「上下文已失效」误判成「不支持浮点纹理」而报错。
   *
   * 改为显式删除自己创建的所有 GL 对象：既不泄漏，也允许同一个 canvas 被重新初始化。
   */
  stop() {
    this.disposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.onResizeBound);
    this.cleanupEvents();
    this.inputManager?.dispose();

    if (!this.gl.isContextLost()) {
      this.renderer?.dispose();
      this.water?.dispose();
    }
    this.renderer = undefined;
    this.water = undefined;
  }

  private update(seconds: number) {
    const water = this.water;
    const renderer = this.renderer;
    const input = this.inputManager;
    if (!water || !renderer || !input) return;
    if (seconds > 1) return;

    this.physics.update(seconds, water, {
      mode: input.mode,
      mousePoint: input.mousePoint,
    });

    // 同步视觉：把鸭子压到水面以下一部分，做出「半浮半沉」的效果。
    //
    // 注意这个值不是随手写的：视觉中心 = duckPosition.y + kDuckMeshYOffset，
    // 而物理平衡点是 center.y = waterHeight + 0.1。原版只减 0.1 时，
    // 鸭子底面刚好停在水面上（几乎没入水），水下色处理没有作用对象，
    // 于是「水上/水下」看起来没有分界。这里下沉到约 40% 没入水中。
    renderer.duckPosition.copy(this.physics.center);
    renderer.duckPosition.y -= kDuckSinkOffset;

    // 朝向速度方向
    const Y = new Vec3(0, 1, 0);
    let Z = this.physics.velocity.clone();
    Z.y = 0;
    if (Z.lengthSq() < 0.001) {
      Z = new Vec3(0, 0, 1).applyQuaternion(renderer.duckQuaternion);
      Z.y = 0;
    }
    Z.normalize();
    const X = new Vec3().crossVectors(Y, Z).normalize();
    Z.crossVectors(X, Y).normalize();
    const targetRot = new Quat().setFromRotationMatrix(mat4MakeBasis(X, Y, Z));
    renderer.duckQuaternion.slerp(targetRot, 0.05);

    // 水面模拟：每帧 4 步 + 法线 + 焦散
    for (let i = 0; i < 4; i++) {
      water.step();
    }
    water.updateNormals();

    renderer.sphereCenter = this.physics.center;
    renderer.sphereRadius = this.physics.radius;
    renderer.updateCaustics(water);
  }

  private draw() {
    const water = this.water;
    const renderer = this.renderer;
    const input = this.inputManager;
    if (!water || !renderer || !input) return;

    const radX = (input.angleX * Math.PI) / 180;
    const radY = (input.angleY * Math.PI) / 180;

    this.camera.position.set(
      Math.sin(radY) * this.dist * Math.cos(radX),
      Math.sin(radX) * this.dist,
      Math.cos(radY) * this.dist * Math.cos(radX),
    );
    this.camera.view = mat4LookAt(
      this.camera.position,
      new Vec3(0, 0.5, 0),
      new Vec3(0, 1, 0),
    );

    renderer.render(water, this.camera);
  }
}

/** 拉取图片并解码为 ImageBitmap（解码不阻塞主线程） */
const fetchBitmap = async (url: string): Promise<ImageBitmap> => {
  const blob = await fetchBlob(url);
  return createImageBitmap(blob);
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 带重试的二进制资源拉取。
 * 网络抖动、代理/CDN 截断、开发服务器偶发空响应都可能返回不完整的数据，
 * 这里统一重试几次再放弃。
 */
const fetchWithRetry = async (
  url: string,
  attempts = 3,
): Promise<ArrayBuffer> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 12) {
        throw new Error(`响应不完整（${buffer.byteLength} 字节）`);
      }
      return buffer;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await delay(150 * (i + 1));
    }
  }
  throw new Error(`加载失败: ${url} (${String(lastError)})`);
};

/** 拉取并校验图片资源 */
const fetchBlob = async (url: string, attempts = 3): Promise<Blob> => {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('响应为空');
      }
      return blob;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await delay(150 * (i + 1));
    }
  }
  throw new Error(`贴图加载失败: ${url} (${String(lastError)})`);
};
