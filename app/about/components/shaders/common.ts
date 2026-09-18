/**
 * 共享 GLSL（GLSL ES 3.00 / WebGL2）
 *
 * 与 three.js ShaderMaterial 时期的差异：
 * - 顶部 `#version 300 es` + `precision highp float`
 * - `varying` -> 顶点 `out` / 片元 `in`
 * - `texture2D` -> `texture`
 * - `gl_FragColor` -> 自定义 `out vec4 fragColor`
 * - three 内置的 `position` / `uv` / `modelMatrix` / `viewMatrix` / `projectionMatrix`
 *   改为显式属性与 uniform（uModel / uView / uProj / aPosition / aUv）
 */

/** 所有水池相关 shader 共享的 uniform 声明 */
export const commonUniforms = `
  uniform float poolHeight;
  uniform float wallHeight;
  uniform vec2 poolSize;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform sampler2D tiles;
  uniform sampler2D causticTex;
  uniform sampler2D water;
  uniform sampler2D duckRefraction;
  uniform vec2 resolution;
`;

/** 水池几何 / 光照 / 焦散相关的公共函数 */
export const helperFunctions = `
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const vec3 abovewaterColor = vec3(0.25, 1.0, 1.25);
  const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);

  vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }

  vec3 getWallColor(vec3 point) {
    float scale = 0.5;

    vec3 wallColor;
    vec3 normal;
    if (abs(point.x) > poolSize.x - 0.01) {
      wallColor = texture(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(-point.x, 0.0, 0.0);
    } else if (abs(point.z) > poolSize.y - 0.01) {
      wallColor = texture(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
      normal = vec3(0.0, 0.0, -point.z);
    } else {
      wallColor = texture(tiles, point.xz * 0.5 + 0.5).rgb;
      normal = vec3(0.0, 1.0, 0.0);
    }

    scale /= length(point);
    scale *= 1.0 - 0.9 / pow(length(point - sphereCenter) / sphereRadius, 4.0);

    vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    float diffuse = max(0.0, dot(refractedLight, normal));

    vec4 info = texture(water, point.xz / (poolSize * 2.0) + 0.5);

    if (point.y < info.r) {
      vec4 caustic = texture(causticTex, 0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) / (poolSize * 2.0) + 0.5);
      scale += diffuse * caustic.r * 2.0 * caustic.g;
    } else {
      vec2 t = intersectCube(point, refractedLight, vec3(-poolSize.x, -poolHeight, -poolSize.y), vec3(poolSize.x, wallHeight, poolSize.y));
      diffuse *= 1.0 / (1.0 + exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - wallHeight)));

      scale += diffuse * 0.5;
    }

    return wallColor * scale;
  }
`;

/** 全屏四边形：aPosition 为 NDC 坐标（-1..1），uv 为 0..1 */
export const fullscreenVertexShader = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 uv;
void main() {
  uv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** 全屏四边形（模拟用）：输出 varying coord，与 three 时期一致 */
export const simulationVertexShader = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 coord;
void main() {
  coord = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** 场景物体通用顶点着色器（池壁 / 立方体） */
export const sceneVertexShader = `#version 300 es
precision highp float;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
in vec3 aPosition;
out vec3 vPosition;
void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;
  gl_Position = uProj * uView * worldPosition;
}
`;

/** 水面顶点着色器：用高度贴图做顶点位移 */
export const waterVertexShader = `#version 300 es
precision highp float;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform sampler2D water;
in vec2 aUv;
out vec3 vPosition;
void main() {
  vec4 info = texture(water, aUv);

  vec3 pos = vec3(aUv.x * 2.0 - 1.0, 0.0, aUv.y * 2.0 - 1.0);
  pos.y += info.r;

  vec4 worldPosition = uModel * vec4(pos, 1.0);
  vPosition = worldPosition.xyz;
  gl_Position = uProj * uView * worldPosition;
}
`;
