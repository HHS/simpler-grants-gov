/** Conservative source edits: TypeScript remains the only acceptance store. */
import {
  lstat,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";
import type { FormDiff, Recorded, Discrepancy } from "../harness/model.ts";

type Edit = { start: number; end: number; text: string };
export interface Preview {
  file: string;
  before: string;
  after: string;
  edits: Edit[];
  expected: FormDiff;
}
function parse(text: string, file: string) {
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (
    (source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
      .parseDiagnostics.length
  )
    throw new Error(
      "Recorded-difference source has invalid TypeScript; repair it before accepting.",
    );
  const declarations = source.statements.flatMap((statement) =>
    ts.isVariableStatement(statement) &&
    statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ? [...statement.declarationList.declarations].filter(
          (d) => ts.isIdentifier(d.name) && d.name.text === "DIFF",
        )
      : [],
  );
  if (
    declarations.length !== 1 ||
    !declarations[0].initializer ||
    !ts.isObjectLiteralExpression(declarations[0].initializer)
  )
    throw new Error(
      "Unsupported DIFF export; expected one literal object. Edit it manually.",
    );
  return { source, root: declarations[0].initializer };
}
function properties(object: ts.ObjectLiteralExpression) {
  const result = new Map<string, ts.PropertyAssignment>();
  for (const property of object.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      !property.name ||
      ![
        ts.SyntaxKind.Identifier,
        ts.SyntaxKind.StringLiteral,
        ts.SyntaxKind.NumericLiteral,
      ].includes(property.name.kind)
    )
      throw new Error(
        "Unsupported computed/spread/shorthand storage on the selected path; edit this register manually.",
      );
    const name = (property.name as ts.Identifier | ts.StringLiteral).text;
    if (result.has(name))
      throw new Error(
        `Duplicate property ${name}; resolve it manually before accepting.`,
      );
    result.set(name, property);
  }
  return result;
}
function literalChild(object: ts.ObjectLiteralExpression, key: string) {
  const property = properties(object).get(key);
  if (!property) return;
  if (!ts.isObjectLiteralExpression(property.initializer))
    throw new Error(
      `Unsupported computed or helper register ${key}; edit it manually. Findings remain available.`,
    );
  return property.initializer;
}

export async function preview(
  directory: string,
  diff: FormDiff,
  comparison: string,
  target: NonNullable<Discrepancy["recordAs"]>,
  entry: Recorded & { plan?: unknown; source?: unknown },
): Promise<Preview> {
  if (target.key === "__proto__")
    throw new Error(
      "The reserved __proto__ dictionary key cannot be recorded by this prototype; edit the model deliberately instead.",
    );
  const matches: {
    file: string;
    text: string;
    parsed: ReturnType<typeof parse>;
  }[] = [];
  for (const name of await readdir(directory)) {
    if (!name.endsWith(".ts") || name.startsWith(".")) continue;
    const file = path.join(directory, name),
      text = await readFile(file, "utf8");
    if (!/export\s+const\s+DIFF\b/.test(text)) continue;
    const parsed = parse(text, file);
    // Discovery reads literal slug only; mutation separately refuses computed ancestors.
    const slug = parsed.root.properties.find(
      (p) =>
        ts.isPropertyAssignment(p) &&
        (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
        p.name.text === "slug",
    );
    if (
      slug &&
      ts.isPropertyAssignment(slug) &&
      ts.isStringLiteral(slug.initializer) &&
      slug.initializer.text === diff.slug
    )
      matches.push({ file, text, parsed });
  }
  if (matches.length !== 1)
    throw new Error(
      "Cannot uniquely locate the registered form's literal DIFF source; edit it manually.",
    );
  const {
    file,
    text: before,
    parsed: { source, root },
  } = matches[0];
  if ((await lstat(file)).isSymbolicLink())
    throw new Error("Refusing to replace a symbolic-link record file.");
  const pair = literalChild(root, comparison);
  const register = pair && literalChild(pair, target.register);
  const property = register && properties(register).get(target.key);
  let edit: Edit;
  const format = (value: unknown, indentation: string) =>
    JSON.stringify(value, null, 2).replaceAll("\n", "\n" + indentation);
  if (property) {
    const start = property.initializer.getStart(source),
      indent =
        before
          .slice(
            before.lastIndexOf("\n", property.getStart(source)) + 1,
            property.getStart(source),
          )
          .match(/^\s*/)?.[0] ?? "";
    edit = {
      start,
      end: property.initializer.end,
      text: format(entry, indent),
    };
  } else {
    const container = register ?? pair ?? root;
    const key = register ? target.key : pair ? target.register : comparison;
    const value = register
      ? entry
      : pair
        ? { [target.key]: entry }
        : { [target.register]: { [target.key]: entry } };
    const start = container.getStart(source),
      end = container.end,
      close = end - 1;
    const parentIndent =
      before
        .slice(before.lastIndexOf("\n", start) + 1, start)
        .match(/^\s*/)?.[0] ?? "";
    const indent = parentIndent + "  ";
    let body = before.slice(start, close);
    const last = container.properties.at(-1);
    if (last && !container.properties.hasTrailingComma)
      body =
        body.slice(0, last.end - start) + "," + body.slice(last.end - start);
    edit = {
      start,
      end,
      text:
        body +
        `\n${indent}${JSON.stringify(key)}: ${format(value, indent)},\n${parentIndent}}`,
    };
  }
  const after =
    before.slice(0, edit.start) + edit.text + before.slice(edit.end);
  parse(after, file);
  const expected = JSON.parse(JSON.stringify(diff)) as FormDiff;
  const rootRecord = expected as unknown as Record<
    string,
    Record<string, Record<string, unknown>>
  >;
  rootRecord[comparison] ??= {};
  rootRecord[comparison][target.register] ??= {};
  rootRecord[comparison][target.register][target.key] = entry;
  return { file, before, after, edits: [edit], expected };
}

export async function commit(
  edit: Preview,
  dryRun: boolean,
  validate?: (file: string) => Promise<void>,
) {
  const temporary = path.join(
    path.dirname(edit.file),
    `.${path.basename(edit.file)}.accept-${randomUUID()}.ts`,
  );
  const stat = await lstat(edit.file);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error("Record destination must remain a regular file.");
  let moved = false;
  try {
    await writeFile(temporary, edit.after, {
      flag: "wx",
      mode: stat.mode & 0o777,
    });
    if (validate) await validate(temporary);
    else {
      const candidate = await import(pathToFileURL(temporary).href);
      if (!isDeepStrictEqual(candidate.DIFF, edit.expected))
        throw new Error(
          "Proposed module changes more than the selected record; no file was replaced.",
        );
    }
    if ((await readFile(edit.file, "utf8")) !== edit.before)
      throw new Error(
        "Record source changed during review; rerun findings before retrying.",
      );
    if (!dryRun) {
      await rename(temporary, edit.file);
      moved = true;
    }
  } finally {
    if (!moved) await unlink(temporary).catch(() => {});
  }
}
