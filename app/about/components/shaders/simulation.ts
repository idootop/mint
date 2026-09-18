import { simulationVertexShader } from './common';

export { simulationVertexShader };

/** 雨滴：在指定位置注入高度 */
export const dropFragmentShader = `#version 300 es
precision highp float;

const float PI = 3.141592653589793;
uniform sampler2D textureMap;
uniform vec2 center;
uniform float radius;
uniform float strength;
uniform vec2 poolSize;
in vec2 coord;
out vec4 fragColor;

void main() {
  vec4 info = texture(textureMap, coord);

  // center 与 coord 都在 UV 空间(0..1)
  // 用世界空间距离计算，保证水滴是圆的
  vec2 uvVector = (center * 0.5 + 0.5) - coord;
  vec2 worldVector = uvVector * poolSize;

  float dist = length(worldVector);
  float drop = max(0.0, 1.0 - dist / radius);

  drop = 0.5 - cos(drop * PI) * 0.5;
  info.r += drop * strength;
  fragColor = info;
}
`;

/** 波动传播：带权重拉普拉斯（处理非正方形宽高比） */
export const updateFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D textureMap;
uniform vec2 delta;
uniform vec2 poolSize;
in vec2 coord;
out vec4 fragColor;

void main() {
  vec4 info = texture(textureMap, coord);

  vec2 dx = vec2(delta.x, 0.0);
  vec2 dy = vec2(0.0, delta.y);

  float u = info.r;
  float u_right = texture(textureMap, coord + dx).r;
  float u_left  = texture(textureMap, coord - dx).r;
  float u_up    = texture(textureMap, coord + dy).r;
  float u_down  = texture(textureMap, coord - dy).r;

  // 权重与 1 / 物理距离^2 成正比
  float fx = 1.0 / (poolSize.x * poolSize.x);
  float fy = 1.0 / (poolSize.y * poolSize.y);

  float spatial_average = ( (u_left + u_right) * fx + (u_up + u_down) * fy ) / (2.0 * (fx + fy));

  info.g += (spatial_average - u) * 2.0;
  info.g *= 0.995;
  info.r += info.g;
  fragColor = info;
}
`;

/** 由高度场求法线，写入 ba 分量 */
export const normalFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D textureMap;
uniform vec2 delta;
uniform vec2 poolSize;
in vec2 coord;
out vec4 fragColor;

void main() {
  vec4 info = texture(textureMap, coord);

  float dx_phys = poolSize.x * delta.x;
  float dy_phys = poolSize.y * delta.y;

  vec3 dx = vec3(dx_phys, texture(textureMap, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
  vec3 dy = vec3(0.0, texture(textureMap, vec2(coord.x, coord.y + delta.y)).r - info.r, dy_phys);

  info.ba = normalize(cross(dy, dx)).xz;
  fragColor = info;
}
`;

/** 鸭子（球体）排开水的体积 */
export const sphereVolumeFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D textureMap;
uniform vec3 oldCenter;
uniform vec3 newCenter;
uniform float radius;
uniform float strength;
uniform vec2 poolSize;
in vec2 coord;
out vec4 fragColor;

float volumeInSphere(vec3 center) {
  // UV -> 世界坐标
  vec3 pos = vec3( (coord.x * 2.0 - 1.0) * poolSize.x/2.0, 0.0, (coord.y * 2.0 - 1.0) * poolSize.y/2.0 );

  // 归一化 center -> 世界坐标
  vec3 worldCenter = vec3(center.x * poolSize.x/2.0, center.y, center.z * poolSize.y/2.0);

  vec3 toCenter = pos - worldCenter;

  float t = length(toCenter) / radius;
  float dy = exp(-pow(t * 1.5, 6.0));
  float ymin = min(0.0, worldCenter.y - dy);
  float ymax = min(max(0.0, worldCenter.y + dy), ymin + 2.0 * dy);
  return (ymax - ymin) * strength;
}

void main() {
  vec4 info = texture(textureMap, coord);
  info.r += volumeInSphere(oldCenter);
  info.r -= volumeInSphere(newCenter);
  fragColor = info;
}
`;
