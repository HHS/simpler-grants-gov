import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

/**
 * Move a `$ref`'s siblings inside an `allOf`, so resolution cannot discard them.
 *
 * `{$ref, title, required}` is valid 2020-12 and means "that schema, plus these", but
 * jsonref -- which the registry resolves with -- returns only the referenced schema and
 * drops everything beside it. A form composing a question and then adding to it therefore
 * loses the addition: a label, a read-only flag, a tighter maxLength, or the requiredness
 * a form declares over a shared question's members.
 *
 * `{allOf: [{$ref}], title, required}` says the same thing and survives, which is why the
 * hand-written forms are shaped that way.
 */
function wrapRefSiblings(node) {
  if (Array.isArray(node)) return node.map(wrapRefSiblings);
  if (node === null || typeof node !== "object") return node;

  const walked = Object.fromEntries(
    Object.entries(node).map(([k, v]) => [k, wrapRefSiblings(v)]),
  );
  const { $ref, ...siblings } = walked;
  if ($ref === undefined || Object.keys(siblings).length === 0) return walked;

  // An existing allOf keeps its branches; the ref joins them.
  const { allOf = [], ...rest } = siblings;
  return { allOf: [{ $ref }, ...allOf], ...rest };
}

/**
 * Inline every question a form references, so the form.json stands alone.
 *
 * The canonical schema points at sibling question files -- a relative $ref such as
 * `../../question-bank/budget/activity-title/schema.json` -- because a question is a
 * published artifact with its own identity. The registry resolves refs with jsonref at
 * registration and cannot follow a relative file path, and the hand-written forms are
 * self-contained for the same reason, so each referenced question is pulled into $defs
 * and the ref rewritten to point there.
 *
 * Each question is keyed by its id, dotted rather than slashed so the key needs no escaping
 * in a JSON pointer: `person/name` is `person.name`. A form's $defs then name the questions
 * it asks, and keep their names when the form or the question bank changes.
 *
 * Questions reference other questions, so this recurses; a question already inlined is
 * reused rather than duplicated.
 */
export async function bundleFormSchema(schema, formDir, questionBankDir) {
  const defs = {};
  // The question each hoisted nested def came from, to name both sides of a conflict.
  const hoistedFrom = new Map();

  // ".../question-bank/person/first-name/schema.json" -> "person.first-name"
  const keyFor = (target) => {
    const id = relative(questionBankDir, dirname(target));
    if (id.startsWith(".."))
      throw new Error(`${target} is not a question in the question bank`);
    return id.split("/").join(".");
  };

  const walk = async (node, baseDir) => {
    if (Array.isArray(node))
      return Promise.all(node.map((n) => walk(n, baseDir)));
    if (node === null || typeof node !== "object") return node;

    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$ref" && typeof v === "string" && !v.startsWith("#")) {
        const target = resolve(baseDir, v);
        const key = keyFor(target);
        if (!(key in defs)) {
          defs[key] = null; // reserve before recursing, so a cycle terminates
          const referenced = await readJson(target);
          const { $schema, $id, $defs: nested, ...body } = referenced;
          // A question carries its own $defs -- a shared enum such as StateCode. Those
          // are hoisted to the form's $defs, because the internal `#/$defs/...` pointers
          // in the inlined body resolve against the document root, which is now the form.
          // Each question carries its own copy under the type's bare name, so a name seen
          // twice must mean the same schema: two different types sharing a name would
          // otherwise leave every reference pointing at whichever was hoisted first.
          for (const [nestedKey, nestedSchema] of Object.entries(
            nested ?? {},
          )) {
            const walked = await walk(nestedSchema, dirname(target));
            if (!(nestedKey in defs)) {
              defs[nestedKey] = walked;
              hoistedFrom.set(nestedKey, key);
            } else if (
              JSON.stringify(defs[nestedKey]) !== JSON.stringify(walked)
            ) {
              throw new Error(
                `${key} and ${hoistedFrom.get(nestedKey)} each define a different $defs/${nestedKey}`,
              );
            }
          }
          defs[key] = await walk(body, dirname(target));
        }
        out.$ref = `#/$defs/${key}`;
      } else {
        out[k] = await walk(v, baseDir);
      }
    }
    return out;
  };

  const { $schema, $id, $defs: existing, ...body } = schema;
  const bundled = await walk(body, formDir);
  // The emitter's own $defs hold inlined local declarations, and those carry refs to
  // published questions too, so they are walked rather than merged through untouched.
  const walkedExisting = existing ? await walk(existing, formDir) : {};
  const merged = { ...walkedExisting, ...defs };
  return wrapRefSiblings({
    ...($schema ? { $schema } : {}),
    ...bundled,
    ...(Object.keys(merged).length ? { $defs: merged } : {}),
  });
}
