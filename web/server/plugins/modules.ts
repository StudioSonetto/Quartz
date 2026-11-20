import { componentTypes, nodeTypes } from "#quartz/type-data";

export default defineNitroPlugin(() =>
  registerTypeData({ nodeTypes, componentTypes }),
);
