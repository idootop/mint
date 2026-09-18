/**
 * 极简数学库：只实现 3D 水池用到的部分。
 * 矩阵为列主序 Float32Array(16)，与 WebGL / three.js 约定一致。
 */

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: Vec3) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v: Vec3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addVectors(a: Vec3, b: Vec3) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  sub(v: Vec3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  subVectors(a: Vec3, b: Vec3) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  multiplyScalar(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  addScaledVector(v: Vec3, s: number) {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }

  negate() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  dot(v: Vec3) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  crossVectors(a: Vec3, b: Vec3) {
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const len = this.length();
    return len === 0 ? this.set(0, 0, 0) : this.multiplyScalar(1 / len);
  }

  applyQuaternion(q: Quat) {
    const { x, y, z } = this;
    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;
    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (qy * z - qz * y);
    const ty = 2 * (qz * x - qx * z);
    const tz = 2 * (qx * y - qy * x);
    // v + q.w * t + cross(q.xyz, t)
    this.x = x + qw * tx + qy * tz - qz * ty;
    this.y = y + qw * ty + qz * tx - qx * tz;
    this.z = z + qw * tz + qx * ty - qy * tx;
    return this;
  }

  /** 等价于 three 的 Vector3.project(camera) */
  project(viewProj: Float32Array) {
    const { x, y, z } = this;
    const w =
      viewProj[3] * x + viewProj[7] * y + viewProj[11] * z + viewProj[15];
    const iw = w === 0 ? 1 : 1 / w;
    const px =
      viewProj[0] * x + viewProj[4] * y + viewProj[8] * z + viewProj[12];
    const py =
      viewProj[1] * x + viewProj[5] * y + viewProj[9] * z + viewProj[13];
    return this.set(
      px * iw,
      py * iw,
      (viewProj[2] * x + viewProj[6] * y + viewProj[10] * z + viewProj[14]) *
        iw,
    );
  }
}

export class Quat {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  copy(q: Quat) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  clone() {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  normalize() {
    const len = Math.hypot(this.x, this.y, this.z, this.w);
    if (len === 0) return this.set(0, 0, 0, 1);
    const inv = 1 / len;
    this.x *= inv;
    this.y *= inv;
    this.z *= inv;
    this.w *= inv;
    return this;
  }

  set(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /** 等价于 three 的 Quaternion.setFromRotationMatrix */
  setFromRotationMatrix(m: Float32Array) {
    const m11 = m[0];
    const m12 = m[4];
    const m13 = m[8];
    const m21 = m[1];
    const m22 = m[5];
    const m23 = m[9];
    const m31 = m[2];
    const m32 = m[6];
    const m33 = m[10];
    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      this.w = 0.25 / s;
      this.x = (m32 - m23) * s;
      this.y = (m13 - m31) * s;
      this.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
      this.w = (m32 - m23) / s;
      this.x = 0.25 * s;
      this.y = (m12 + m21) / s;
      this.z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      this.w = (m13 - m31) / s;
      this.x = (m12 + m21) / s;
      this.y = 0.25 * s;
      this.z = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
      this.w = (m21 - m12) / s;
      this.x = (m13 + m31) / s;
      this.y = (m23 + m32) / s;
      this.z = 0.25 * s;
    }
    return this;
  }

  /** 等价于 three 的 Quaternion.slerp（球面线性插值，按 t 从 this 向 q 靠拢） */
  slerp(q: Quat, t: number) {
    if (t === 0) return this;
    if (t === 1) return this.copy(q);

    const { x, y, z, w } = this;
    let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;
    let qx = q.x;
    let qy = q.y;
    let qz = q.z;
    let qw = q.w;

    if (cosHalfTheta < 0) {
      cosHalfTheta = -cosHalfTheta;
      qx = -qx;
      qy = -qy;
      qz = -qz;
      qw = -qw;
    }

    if (cosHalfTheta >= 1.0) {
      return this.set(x, y, z, w);
    }

    const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;
    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - t;
      return this.set(
        s * x + t * qx,
        s * y + t * qy,
        s * z + t * qz,
        s * w + t * qw,
      ).normalize();
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    return this.set(
      x * ratioA + qx * ratioB,
      y * ratioA + qy * ratioB,
      z * ratioA + qz * ratioB,
      w * ratioA + qw * ratioB,
    );
  }
}

/** 单位矩阵 */
export const mat4Identity = (): Float32Array =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** out = a * b（列主序） */
export const mat4Multiply = (
  a: Float32Array,
  b: Float32Array,
  out: Float32Array,
) => {
  for (let i = 0; i < 4; i++) {
    const b0 = b[i * 4];
    const b1 = b[i * 4 + 1];
    const b2 = b[i * 4 + 2];
    const b3 = b[i * 4 + 3];
    out[i * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[i * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[i * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[i * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
};

/** 透视投影矩阵（fovY 为角度制，垂直视场角） */
export const mat4Perspective = (
  fovY: number,
  aspect: number,
  near: number,
  far: number,
) => {
  const top = near * Math.tan(fovY * DEG2RAD * 0.5);
  const height = 2 * top;
  const width = aspect * height;
  const left = -0.5 * width;
  const right = left + width;
  const bottom = top - height;

  const x = (2 * near) / (right - left);
  const y = (2 * near) / (top - bottom);
  const a = (right + left) / (right - left);
  const b = (top + bottom) / (top - bottom);
  const c = -(far + near) / (far - near);
  const d = (-2 * far * near) / (far - near);

  return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, a, b, c, -1, 0, 0, d, 0]);
};

/** 视图矩阵（world -> view） */
export const mat4LookAt = (eye: Vec3, target: Vec3, up: Vec3) => {
  const z = new Vec3().subVectors(eye, target);
  if (z.lengthSq() === 0) z.set(0, 0, 1);
  z.normalize();

  const x = new Vec3().crossVectors(up, z);
  if (x.lengthSq() === 0) {
    // up 与视线平行时轻微扰动，避免退化
    z.x += 0.0001;
    x.crossVectors(up, z);
  }
  x.normalize();
  const y = new Vec3().crossVectors(z, x);

  return new Float32Array([
    x.x,
    y.x,
    z.x,
    0,
    x.y,
    y.y,
    z.y,
    0,
    x.z,
    y.z,
    z.z,
    0,
    -x.dot(eye),
    -y.dot(eye),
    -z.dot(eye),
    1,
  ]);
};

/** 4x4 逆矩阵（用于反投影射线） */
export const mat4Invert = (m: Float32Array) => {
  const n11 = m[0],
    n21 = m[1],
    n31 = m[2],
    n41 = m[3];
  const n12 = m[4],
    n22 = m[5],
    n32 = m[6],
    n42 = m[7];
  const n13 = m[8],
    n23 = m[9],
    n33 = m[10],
    n43 = m[11];
  const n14 = m[12],
    n24 = m[13],
    n34 = m[14],
    n44 = m[15];

  const t11 =
    n23 * n34 * n42 -
    n24 * n33 * n42 +
    n24 * n32 * n43 -
    n22 * n34 * n43 -
    n23 * n32 * n44 +
    n22 * n33 * n44;
  const t12 =
    n14 * n33 * n42 -
    n13 * n34 * n42 -
    n14 * n32 * n43 +
    n12 * n34 * n43 +
    n13 * n32 * n44 -
    n12 * n33 * n44;
  const t13 =
    n13 * n24 * n42 -
    n14 * n23 * n42 +
    n14 * n22 * n43 -
    n12 * n24 * n43 -
    n13 * n22 * n44 +
    n12 * n23 * n44;
  const t14 =
    n14 * n23 * n32 -
    n13 * n24 * n32 -
    n14 * n22 * n33 +
    n12 * n24 * n33 +
    n13 * n22 * n34 -
    n12 * n23 * n34;

  const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
  if (det === 0) return mat4Identity();
  const detInv = 1 / det;

  return new Float32Array([
    t11 * detInv,
    (n24 * n33 * n41 -
      n23 * n34 * n41 -
      n24 * n31 * n43 +
      n21 * n34 * n43 +
      n23 * n31 * n44 -
      n21 * n33 * n44) *
      detInv,
    (n22 * n34 * n41 -
      n24 * n32 * n41 +
      n24 * n31 * n42 -
      n21 * n34 * n42 -
      n22 * n31 * n44 +
      n21 * n32 * n44) *
      detInv,
    (n23 * n32 * n41 -
      n22 * n33 * n41 -
      n23 * n31 * n42 +
      n21 * n33 * n42 +
      n22 * n31 * n43 -
      n21 * n32 * n43) *
      detInv,

    t12 * detInv,
    (n13 * n34 * n41 -
      n14 * n33 * n41 +
      n14 * n31 * n43 -
      n11 * n34 * n43 -
      n13 * n31 * n44 +
      n11 * n33 * n44) *
      detInv,
    (n14 * n32 * n41 -
      n12 * n34 * n41 -
      n14 * n31 * n42 +
      n11 * n34 * n42 +
      n12 * n31 * n44 -
      n11 * n32 * n44) *
      detInv,
    (n12 * n33 * n41 -
      n13 * n32 * n41 +
      n13 * n31 * n42 -
      n11 * n33 * n42 -
      n12 * n31 * n43 +
      n11 * n32 * n43) *
      detInv,

    t13 * detInv,
    (n14 * n23 * n41 -
      n13 * n24 * n41 -
      n14 * n21 * n43 +
      n11 * n24 * n43 +
      n13 * n21 * n44 -
      n11 * n23 * n44) *
      detInv,
    (n12 * n24 * n41 -
      n14 * n22 * n41 +
      n14 * n21 * n42 -
      n11 * n24 * n42 -
      n12 * n21 * n44 +
      n11 * n22 * n44) *
      detInv,
    (n13 * n22 * n41 -
      n12 * n23 * n41 -
      n13 * n21 * n42 +
      n11 * n23 * n42 +
      n12 * n21 * n43 -
      n11 * n22 * n43) *
      detInv,

    t14 * detInv,
    (n13 * n24 * n31 -
      n14 * n23 * n31 +
      n14 * n21 * n33 -
      n11 * n24 * n33 -
      n13 * n21 * n34 +
      n11 * n23 * n34) *
      detInv,
    (n14 * n22 * n31 -
      n12 * n24 * n31 -
      n14 * n21 * n32 +
      n11 * n24 * n32 +
      n12 * n21 * n34 -
      n11 * n22 * n34) *
      detInv,
    (n12 * n23 * n31 -
      n13 * n22 * n31 +
      n13 * n21 * n32 -
      n11 * n23 * n32 -
      n12 * n21 * n33 +
      n11 * n22 * n33) *
      detInv,
  ]);
};

/** 由基向量构造矩阵（等价于 three 的 Matrix4.makeBasis） */
export const mat4MakeBasis = (x: Vec3, y: Vec3, z: Vec3) =>
  new Float32Array([
    x.x,
    x.y,
    x.z,
    0,
    y.x,
    y.y,
    y.z,
    0,
    z.x,
    z.y,
    z.z,
    0,
    0,
    0,
    0,
    1,
  ]);

/** 由平移 + 四元数 + 缩放构造矩阵（等价于 three 的 compose） */
export const mat4Compose = (
  pos: Vec3,
  quat: Quat,
  scale: Vec3 | number,
  out: Float32Array = new Float32Array(16),
) => {
  const { x, y, z, w } = quat;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  const sx = typeof scale === 'number' ? scale : scale.x;
  const sy = typeof scale === 'number' ? scale : scale.y;
  const sz = typeof scale === 'number' ? scale : scale.z;

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = pos.x;
  out[13] = pos.y;
  out[14] = pos.z;
  out[15] = 1;
  return out;
};

/** 用 4x4 矩阵变换点（含透视除法前） */
export const vec3TransformMat4 = (v: Vec3, m: Float32Array) => {
  const { x, y, z } = v;
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  return new Vec3(
    (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
    (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
  );
};
