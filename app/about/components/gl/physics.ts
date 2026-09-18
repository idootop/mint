import { Vec3 } from './math';
import type { WaterSimulation } from './water';

const MODE_MOVE_SPHERE = 1;

export interface InputState {
  mode: number;
  mousePoint: Vec3 | null;
}

/**
 * 鸭子（球体）的浮力与碰撞。
 * 对应 three.js 时期的 core/Physics.ts。
 */
export class PhysicsEngine {
  center = new Vec3(0, 0, 0);
  oldCenter = new Vec3(0, 0, 0);
  velocity = new Vec3();
  gravity = new Vec3(0, -4, 0);

  radius = 0.25;

  poolWidth = 2;
  poolLength = 2;
  poolDepth = 0;

  sphereFloatRatio = 0.7;
  sphereImpactStrength = 0.04;
  useSpherePhysics = true;

  update(seconds: number, water: WaterSimulation, input: InputState) {
    if (input.mode === MODE_MOVE_SPHERE) {
      this.velocity.set(0, 0, 0);
    } else if (this.useSpherePhysics) {
      const waterInfo = water.getWaterAt(this.center.x, this.center.z);
      const waterHeight = waterInfo.height;

      const percentUnderWater = Math.max(
        0,
        Math.min(
          1,
          (waterHeight + this.radius - this.center.y) / (2 * this.radius),
        ),
      );

      const buoyancyFactor = 1.0 / (1.0 - this.sphereFloatRatio);

      // 重力与浮力（垂直方向）
      const gTerm = this.gravity
        .clone()
        .multiplyScalar(seconds - buoyancyFactor * seconds * percentUnderWater);
      this.velocity.add(gTerm);

      // 鼠标排斥
      if (input.mousePoint) {
        const distVec = this.center.clone().sub(input.mousePoint);
        distVec.y = 0;
        const dist = distVec.length();
        const influenceRadius = 1;

        if (dist < influenceRadius) {
          const pushStrength = 2.0;
          const force = distVec
            .normalize()
            .multiplyScalar(
              pushStrength * (1.0 - dist / influenceRadius) * seconds,
            );
          this.velocity.add(force);
        }
      }

      if (this.velocity.lengthSq() > 0) {
        const drag = this.velocity
          .clone()
          .normalize()
          .multiplyScalar(
            percentUnderWater * seconds * this.velocity.dot(this.velocity),
          );
        this.velocity.sub(drag);
      }

      this.center.add(this.velocity.clone().multiplyScalar(seconds));

      // 池壁碰撞（X）
      if (this.center.x < this.radius - this.poolWidth / 2) {
        this.center.x = this.radius - this.poolWidth / 2;
        this.velocity.x = Math.abs(this.velocity.x) * 0.5;
      } else if (this.center.x > this.poolWidth / 2 - this.radius) {
        this.center.x = this.poolWidth / 2 - this.radius;
        this.velocity.x = -Math.abs(this.velocity.x) * 0.5;
      }

      // 池壁碰撞（Z）
      if (this.center.z < this.radius - this.poolLength / 2) {
        this.center.z = this.radius - this.poolLength / 2;
        this.velocity.z = Math.abs(this.velocity.z) * 0.5;
      } else if (this.center.z > this.poolLength / 2 - this.radius) {
        this.center.z = this.poolLength / 2 - this.radius;
        this.velocity.z = -Math.abs(this.velocity.z) * 0.5;
      }

      // 池底碰撞
      if (this.center.y < this.radius - this.poolDepth) {
        this.center.y = this.radius - this.poolDepth;
        this.velocity.y = Math.abs(this.velocity.y) * 0.7;
      }
    }

    // 与水面的相互作用
    water.moveSphere(
      this.oldCenter,
      this.center,
      this.radius,
      this.sphereImpactStrength,
    );
    this.oldCenter.copy(this.center);
  }
}
