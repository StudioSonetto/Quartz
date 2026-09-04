export function wrapAngle(degrees: number) {
  return 180 - ((((180 - degrees) % 360) + 360) % 360);
}
