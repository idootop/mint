import { commonUniforms, helperFunctions } from './common';

export { waterVertexShader } from './common';

export const waterFragmentShader = `#version 300 es
precision highp float;

${commonUniforms}
uniform vec3 eye;
uniform sampler2D sky;
in vec3 vPosition;
out vec4 fragColor;

${helperFunctions}

vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
    vec3 color;
    if (ray.y < 0.0) {
      vec2 t = intersectCube(origin, ray, vec3(-poolSize.x, -poolHeight, -poolSize.y), vec3(poolSize.x, wallHeight, poolSize.y));
      color = getWallColor(origin + ray * t.y);
    } else {
      vec2 t = intersectCube(origin, ray, vec3(-poolSize.x, -poolHeight, -poolSize.y), vec3(poolSize.x, wallHeight, poolSize.y));
      vec3 hit = origin + ray * t.y;
      if (hit.y < wallHeight - 0.001) {
        color = getWallColor(hit);
      } else {
        vec2 uv = ray.xz * 0.5 + 0.5;
        color = texture(sky, uv).rgb;
        color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
      }
    }

    if (ray.y < 0.0) color *= waterColor;
    return color;
}

void main() {
  vec3 position = vPosition;

  vec2 coord = position.xz / (poolSize * 2.0) + 0.5;

  vec4 info = texture(water, coord);

  for (int i = 0; i < 5; i++) {
    coord += info.ba * 0.005;
    info = texture(water, coord);
  }

  vec3 normal = vec3(info.b, sqrt(1.0 - dot(info.ba, info.ba)), info.a);
  vec3 incomingRay = normalize(position - eye);

  vec3 reflectedRay;
  vec3 refractedRay;
  float fresnel;

  if (dot(incomingRay, normal) < 0.0) {
    /* 水面上方 (Above Water) */
    reflectedRay = reflect(incomingRay, normal);
    refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
    fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
  } else {
    /* 水面下方 (Below Water) */
    normal = -normal;
    reflectedRay = reflect(incomingRay, normal);
    refractedRay = refract(incomingRay, normal, IOR_WATER / IOR_AIR);
    fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
  }

  vec3 reflectedColor = getSurfaceRayColor(position, reflectedRay, abovewaterColor);
  vec3 refractedColor = vec3(0.0);

  if (length(refractedRay) > 0.001) {
     refractedColor = getSurfaceRayColor(position, refractedRay, abovewaterColor);

     // --- 鸭子折射 (Screen Space Refraction) ---
     vec2 screenUV = gl_FragCoord.xy / resolution;
     vec2 refractionUV = screenUV - (normal.xz * vec2(0.05, 0.05 * resolution.x / resolution.y));

     vec4 duckSample = texture(duckRefraction, refractionUV);

     // 有内容(alpha > 0)时覆盖射线追踪得到的池壁颜色
     refractedColor = mix(refractedColor, duckSample.rgb, duckSample.a);

  } else {
     fresnel = 1.0; // 全反射
  }

  fragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
}
`;

export const cubeFragmentShader = `#version 300 es
precision highp float;

${commonUniforms}
in vec3 vPosition;
out vec4 fragColor;

${helperFunctions}

void main() {
  if (vPosition.y > wallHeight - 0.001) discard;
  vec3 position = vPosition;
  fragColor = vec4(getWallColor(position), 1.0);
  vec4 info = texture(water, position.xz / (poolSize * 2.0) + 0.5);
  if (position.y < info.r) {
    fragColor.rgb *= underwaterColor * 1.2;
  }
}
`;
