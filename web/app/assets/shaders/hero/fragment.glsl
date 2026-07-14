uniform float uGrainSize;
uniform float uGrainIntensity;

varying vec2 vUv;
varying vec3 vColor;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uvNoise = vUv * uGrainSize;
  float noise = random(uvNoise) * uGrainIntensity;

  vec3 color = vColor + noise;

  gl_FragColor = vec4(color, 1.0);
}
