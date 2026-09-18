import { mat4Invert, mat4Multiply, Vec3 } from './math';
import type { Camera } from './renderer';

export const MODE_ADD_DROPS = 0;
export const MODE_MOVE_SPHERE = 1;
export const MODE_ORBIT_CAMERA = 2;

interface Ray {
  origin: Vec3;
  direction: Vec3;
}

/** 射线与平面求交（平面由法线与平面上一点确定），返回交点或 null */
const intersectPlane = (
  ray: Ray,
  planeNormal: Vec3,
  planePoint: Vec3,
): Vec3 | null => {
  const denom = planeNormal.dot(ray.direction);
  if (Math.abs(denom) < 1e-8) return null;
  const t = planeNormal.dot(planePoint) - planeNormal.dot(ray.origin);
  const distance = t / denom;
  if (distance < 0) return null;
  return ray.origin.clone().addScaledVector(ray.direction, distance);
};

/** 射线与球求交，返回最近的正向交点或 null */
const intersectSphere = (
  ray: Ray,
  center: Vec3,
  radius: number,
): Vec3 | null => {
  const toSphere = ray.origin.clone().sub(center);
  const a = ray.direction.dot(ray.direction);
  const b = 2.0 * toSphere.dot(ray.direction);
  const c = toSphere.dot(toSphere) - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant <= 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  if (t <= 0) return null;
  return ray.origin.clone().addScaledVector(ray.direction, t);
};

/**
 * 鼠标 / 触摸交互：加水滴、拖动鸭子、轨道相机。
 * 对应 three.js 时期的 core/InputManager.ts（用解析求交替代 Raycaster）。
 */
export class InputManager {
  mousePoint: Vec3 | null = new Vec3(100, 100, 100);
  angleX = 90;
  angleY = 180;

  mode = -1;

  private getCamera: () => Camera;
  private domElement: HTMLElement;

  private oldX = 0;
  private oldY = 0;
  private prevHit = new Vec3();
  private planeNormal = new Vec3(0, 0, 1);

  onAddDrop: ((x: number, z: number) => void) | null = null;
  onMoveSphere: ((delta: Vec3) => void) | null = null;

  getContext: () => {
    center: Vec3;
    radius: number;
    poolWidth: number;
    poolLength: number;
  } = () => ({
    center: new Vec3(),
    radius: 0.25,
    poolWidth: 2,
    poolLength: 2,
  });

  private disposers: Array<() => void> = [];

  constructor(getCamera: () => Camera, domElement: HTMLElement) {
    this.getCamera = getCamera;
    this.domElement = domElement;
    this.initListeners();
  }

  private initListeners() {
    const add = <K extends keyof WindowEventMap>(
      target: Window | Document | HTMLElement,
      type: K | string,
      handler: any,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, handler, options);
      this.disposers.push(() => target.removeEventListener(type, handler));
    };

    add(window, 'mousemove', this.onMouseMoveGlobal.bind(this));
    add(window, 'deviceorientation', this.onDeviceOrientation.bind(this));
    add(this.domElement, 'mousedown', this.onMouseDown.bind(this));
    add(document, 'mousemove', this.onDragMove.bind(this));
    add(document, 'mouseup', this.onDragEnd.bind(this));
    add(this.domElement, 'touchstart', this.onTouchStart.bind(this), {
      passive: false,
    });
    add(this.domElement, 'touchmove', this.onTouchMove.bind(this), {
      passive: false,
    });
    add(this.domElement, 'touchend', this.onTouchEnd.bind(this));
  }

  dispose() {
    for (const d of this.disposers) d();
    this.disposers = [];
  }

  /** 由屏幕坐标构造世界空间射线（等价 three 的 Raycaster.setFromCamera） */
  private getRay(clientX: number, clientY: number): Ray {
    const camera = this.getCamera();
    const rect = this.domElement.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const viewProj = mat4Multiply(
      camera.proj,
      camera.view,
      new Float32Array(16),
    );
    const inv = mat4Invert(viewProj);

    const p0 = new Vec3(ndcX, ndcY, -1);
    const p1 = new Vec3(ndcX, ndcY, 1);
    const w0 = p0.project(inv);
    const w1 = p1.project(inv);

    return {
      origin: camera.position.clone(),
      direction: w1.sub(w0).normalize(),
    };
  }

  private updateMousePoint(ndcX: number, ndcY: number) {
    const camera = this.getCamera();
    const viewProj = mat4Multiply(
      camera.proj,
      camera.view,
      new Float32Array(16),
    );
    const inv = mat4Invert(viewProj);
    const near = new Vec3(ndcX, ndcY, -1).project(inv);
    const far = new Vec3(ndcX, ndcY, 1).project(inv);
    const ray: Ray = {
      origin: camera.position.clone(),
      direction: far.sub(near).normalize(),
    };
    const hit = intersectPlane(ray, new Vec3(0, 1, 0), new Vec3(0, 0, 0));
    if (hit) this.mousePoint = hit;
  }

  private onMouseMoveGlobal(e: MouseEvent) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.updateMousePoint(x, y);
  }

  private onDeviceOrientation(e: DeviceOrientationEvent) {
    const ctx = this.getContext();
    this.updateFromOrientation(e, ctx.center);
  }

  startDrag(
    x: number,
    y: number,
    sphereCenter: Vec3,
    sphereRadius: number,
    poolWidth: number,
    poolLength: number,
  ) {
    this.oldX = x;
    this.oldY = y;

    const ray = this.getRay(x, y);

    // 1. 命中鸭子（球体）
    const sphereHit = intersectSphere(ray, sphereCenter, sphereRadius);

    if (sphereHit) {
      this.mode = MODE_MOVE_SPHERE;
      this.prevHit = sphereHit;
      // 面向相机的平面法线。等价 three 的 camera.getWorldDirection() 取反：
      // 视图矩阵第 3 列就是相机的 world Z（朝后）轴。
      const view = this.getCamera().view;
      this.planeNormal = new Vec3(view[8], view[9], view[10]).normalize();
    } else {
      // 2. 命中水面平面
      const hit = intersectPlane(ray, new Vec3(0, 1, 0), new Vec3(0, 0, 0));
      if (
        hit &&
        Math.abs(hit.x) < poolWidth / 2 &&
        Math.abs(hit.z) < poolLength / 2
      ) {
        this.mode = MODE_ADD_DROPS;
        this.handleDragInteraction(x, y);
      } else {
        this.mode = MODE_ORBIT_CAMERA;
      }
    }
  }

  handleDragInteraction(x: number, y: number, fromTouch = false) {
    switch (this.mode) {
      case MODE_ADD_DROPS: {
        const ray = this.getRay(x, y);
        const hit = intersectPlane(ray, new Vec3(0, 1, 0), new Vec3(0, 0, 0));
        if (hit && this.onAddDrop) {
          this.onAddDrop(hit.x, hit.z);
        }
        if (fromTouch) {
          const ndcX = (x / window.innerWidth) * 2 - 1;
          const ndcY = -(y / window.innerHeight) * 2 + 1;
          this.updateMousePoint(ndcX, ndcY);
        }
        break;
      }
      case MODE_MOVE_SPHERE: {
        const ray = this.getRay(x, y);
        const nextHit = intersectPlane(ray, this.planeNormal, this.prevHit);
        if (nextHit) {
          // 必须先 clone：Vec3.sub 会原地修改，直接写 nextHit.sub(...) 会让
          // delta 与 nextHit 变成同一个对象，紧接着 this.prevHit = nextHit
          // 就把「上一帧命中点」存成了「位移量」，下一步的 delta 全乱套。
          // three 原版这里正是 nextHit.clone().sub(this.prevHit)。
          const delta = nextHit.clone().sub(this.prevHit);
          if (this.onMoveSphere) {
            this.onMoveSphere(delta);
          }
          this.prevHit = nextHit;
        }
        break;
      }
      case MODE_ORBIT_CAMERA: {
        this.angleY -= x - this.oldX;
        this.angleX -= y - this.oldY;
        this.angleX = Math.max(-89.999, Math.min(89.999, this.angleX));
        break;
      }
    }
    this.oldX = x;
    this.oldY = y;
  }

  stopDrag() {
    this.mode = -1;
  }

  private onMouseDown(e: MouseEvent) {
    const ctx = this.getContext();
    this.startDrag(
      e.pageX,
      e.pageY,
      ctx.center,
      ctx.radius,
      ctx.poolWidth,
      ctx.poolLength,
    );
  }

  private onDragMove(e: MouseEvent) {
    if (this.mode !== -1) {
      this.handleDragInteraction(e.pageX, e.pageY);
    }
  }

  private onDragEnd() {
    this.stopDrag();
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const ctx = this.getContext();
      this.startDrag(
        e.touches[0].pageX,
        e.touches[0].pageY,
        ctx.center,
        ctx.radius,
        ctx.poolWidth,
        ctx.poolLength,
      );
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.handleDragInteraction(e.touches[0].pageX, e.touches[0].pageY, true);
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.stopDrag();
    }
  }

  /** 陀螺仪：把倾斜映射为对鸭子的推力 */
  updateFromOrientation(e: DeviceOrientationEvent, center: Vec3) {
    if (e.gamma === null || e.beta === null) return;

    const maxTilt = 30;
    const gamma = Math.min(Math.max(e.gamma, -maxTilt), maxTilt);
    const beta = Math.min(Math.max(e.beta, -maxTilt), maxTilt);

    const ndcX = -(gamma / maxTilt);
    const ndcY = -(beta / maxTilt);

    const camera = this.getCamera();
    const viewProj = mat4Multiply(
      camera.proj,
      camera.view,
      new Float32Array(16),
    );
    const duckScreenPos = center.clone().project(viewProj);
    const inputVec = new Vec3(-ndcX, ndcY, 0);
    const intensity = Math.hypot(inputVec.x, inputVec.y);

    if (intensity < 0.1) {
      this.mousePoint = new Vec3(100, 100, 100);
      return;
    }

    const dir = inputVec.normalize();
    const offsetNDC = new Vec3(
      duckScreenPos.x + dir.x * 0.05,
      duckScreenPos.y + dir.y * 0.05,
      0,
    );

    const inv = mat4Invert(viewProj);
    const near = offsetNDC
      .clone()
      .set(offsetNDC.x, offsetNDC.y, -1)
      .project(inv);
    const far = offsetNDC.clone().set(offsetNDC.x, offsetNDC.y, 1).project(inv);
    const ray: Ray = {
      origin: camera.position.clone(),
      direction: far.sub(near).normalize(),
    };

    const targetPoint = intersectPlane(
      ray,
      new Vec3(0, 1, 0),
      new Vec3(0, 0, 0),
    );
    if (targetPoint) {
      const worldDir = targetPoint.sub(center).normalize();
      worldDir.y = 0;
      const clampedIntensity = Math.min(intensity, 1.0);
      const dist = 1 - clampedIntensity * 0.5;
      this.mousePoint = center.clone().add(worldDir.multiplyScalar(dist));
    }
  }
}
