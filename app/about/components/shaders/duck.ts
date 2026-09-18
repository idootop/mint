/**
 * 鸭子网格着色器。
 *
 * 对齐 three.js 时期的观感：MeshStandardMaterial(metalness=0, roughness=1)
 * + AmbientLight(0xffffff, 0.5) + DirectionalLight(0xffffff, 1.0)，
 * baseColorTexture 以 sRGB 解码、光照在线性空间计算、输出再编码回 sRGB。
 *
 * 另外，水面以下的部分会整体压暗，让没入水中的身体明显变深。
 *
 * 注意这里**不能**直接套用池壁那套 `underwaterColor * 1.2`（= vec3(0.48,1.08,1.2)）：
 * 那是给蓝绿色池壁设计的，乘到黄色鸭子身上会把 R 压掉、G 保留，整块变成绿色。
 * 实测原版水下部分是「整体亮度降到 ~0.70、基本不偏色」（R/G 比值 0.70/0.69），
 * 所以这里用近乎中性的轻微冷色衰减来还原同样的观感。
 */

export const duckVertexShader = `#version 300 es
precision highp float;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
out vec3 vNormal;
out vec2 vUv;
out vec3 vWorldPos;
void main() {
  vUv = aUv;
  // 模型矩阵只含均匀缩放 + 旋转，可直接用左上 3x3
  vNormal = mat3(uModel) * aNormal;
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = uProj * uView * worldPosition;
}
`;

export const duckFragmentShader = `#version 300 es
precision highp float;

const float PI = 3.141592653589793;
// 水下衰减：整体亮度降到约 0.70，带一点点冷色，实测原版即为此比例
const vec3 underwaterAttenuation = vec3(0.68, 0.70, 0.74);

uniform sampler2D duckTex;
uniform vec3 lightDir;
// 水面高度场，用于判断当前片元是否在水下
uniform sampler2D water;
uniform vec2 poolSize;

in vec3 vNormal;
in vec2 vUv;
in vec3 vWorldPos;
out vec4 fragColor;

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  vec3 albedo = srgbToLinear(texture(duckTex, vUv).rgb);

  vec3 N = normalize(vNormal);
  vec3 L = normalize(lightDir);
  float ndl = max(dot(N, L), 0.0);

  // three: irradiance = ambient(0.5) + directional(1.0) * NdotL，diffuse = albedo / PI * irradiance
  vec3 irradiance = vec3(0.5) + vec3(ndl);
  vec3 color = linearToSrgb(albedo * irradiance / PI);

  // 水面以下：整体压暗，让水上/水下有明显分界
  float waterHeight = texture(water, vWorldPos.xz / (poolSize * 2.0) + 0.5).r;
  if (vWorldPos.y < waterHeight) {
    color *= underwaterAttenuation;
  }

  fragColor = vec4(color, 1.0);
}
`;
