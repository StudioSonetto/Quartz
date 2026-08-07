import {
  BoxGeometry,
  IcosahedronGeometry,
  SphereGeometry,
  TetrahedronGeometry,
} from "three";

export const primitiveGeometries = {
  box: new BoxGeometry(1, 1, 1),
  icosahedron: new IcosahedronGeometry(),
  triangle: new TetrahedronGeometry(),
  sphere: new SphereGeometry(0.5, 32, 32),
};

export const primitiveTypes = Object.keys(primitiveGeometries);

export function getPrimitiveGeometry(type: string) {
  return primitiveGeometries[type as keyof typeof primitiveGeometries];
}
