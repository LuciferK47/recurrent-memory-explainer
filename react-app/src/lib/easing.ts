/** Small, dependency-free easing/interpolation primitives shared by the Stage's layout blending and the write-animation timeline. */

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Classic smoothstep — used to blend StageLayouts across a scene's morph band. */
export const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

export const easeOutQuad = (t: number): number => {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
};

export const easeInOutCubic = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
