import type { DecoratorContext, Model } from "@typespec/compiler";
import { stateKeys } from "./lib.js";

/** How sync installs a form, from `@Sgg.sync`'s options. */
export interface SyncOptions {
  xml: boolean;
}

/** `@Sgg.sync`: install this form into the API tree when `npm run sync` runs. */
export const $sync = (
  ctx: DecoratorContext,
  target: Model,
  options?: { xml?: boolean },
) =>
  ctx.program
    .stateMap(stateKeys.sync)
    .set(target, { xml: options?.xml ?? true } satisfies SyncOptions);
