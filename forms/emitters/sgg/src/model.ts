import type { Model, Program } from "@typespec/compiler";
import type { SyncOptions } from "./decorators.js";
import { stateKeys } from "./lib.js";

/** `@Sgg.sync`'s options, or undefined when sync does not install this form. */
export const modelSync = (p: Program, model: Model) =>
  p.stateMap(stateKeys.sync).get(model) as SyncOptions | undefined;
