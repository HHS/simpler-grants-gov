import type { DecoratorContext, Model, Scalar } from "@typespec/compiler";
import { stateKeys } from "./lib.js";

/** How sync installs a form, from `@Sgg.sync`'s options. */
export interface SyncOptions {
  /** The format sync installs the form's XML mapping in, or false for none. */
  xml: false | "transform" | "mapping";
  sggVersion: string;
  instructions?: string;
}

/** `@Sgg.sync`: install this form into the API tree when `npm run sync` runs. */
export const $sync = (
  ctx: DecoratorContext,
  target: Model,
  options?: {
    xml?: boolean | "transform" | "mapping";
    sggVersion?: string;
    instructions?: string;
  },
) =>
  ctx.program.stateMap(stateKeys.sync).set(target, {
    xml:
      options?.xml === true || options?.xml === undefined
        ? "transform"
        : options.xml,
    sggVersion: options?.sggVersion ?? "1.0",
    ...(options?.instructions && { instructions: options.instructions }),
  } satisfies SyncOptions);

/** `@Sgg.attachment`: this question's answer is the id of one of the application's uploads. */
export const $attachment = (ctx: DecoratorContext, target: Scalar) =>
  ctx.program.stateSet(stateKeys.attachment).add(target);
