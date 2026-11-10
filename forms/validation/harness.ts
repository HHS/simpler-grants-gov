import addFormats from "ajv-formats";
import { Ajv2020 } from "ajv/dist/2020.js";

import { loadFormSchema } from "../parity/harness/load.ts";

/** Validate answers against the emitted draft-2020-12 form, using the parity loader. */
export async function loadFormValidator(specId: string) {
  const schema = await loadFormSchema(specId);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats.default(ajv);
  return { schema, validate: ajv.compile(schema) };
}
