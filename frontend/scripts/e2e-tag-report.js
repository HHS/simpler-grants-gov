#!/usr/bin/env node
"use strict";

/**
 * Print a count and full test list per Playwright tag, for every test() /
 * test.skip() / test.only() defined under tests/e2e/**\/*.spec.ts.
 *
 * Usage: node e2e-tag-report.js [path-to-tests/e2e]
 *
 * Parses each spec file into a real TypeScript AST (via the `typescript`
 * package already in this repo's devDependencies) instead of pattern
 * matching on text, so string-literal quoting/escaping, comments, and
 * loop-generated tests (scenario arrays destructured in a for-of) all
 * resolve correctly rather than needing regex special-casing.
 *
 * Only documented parts of the compiler API are used: node.kind compared
 * against ts.SyntaxKind (the officially documented way to identify a node's
 * type - see https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API),
 * plus ts.forEachChild / ts.createSourceFile / node.getText(). The many
 * undocumented `ts.isXxx()` narrowing helpers (isPropertyAssignment,
 * isEnumDeclaration, etc.) are deliberately avoided.
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

// --- Constants ---------------------------------------------------------

const DEFAULT_E2E_DIR = "tests/e2e";
const NO_TAGS = "No tags";

// SyntaxKind has no single documented "is this callable" grouping, so the
// relevant function-like kinds are listed explicitly.
const FUNCTION_LIKE_KINDS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
]);

const STRING_LITERAL_LIKE_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
]);

// --- Functions -----------------------------------------------------------

function throwError(msg) {
  console.error(`error: ${msg}`);
  console.error("usage: node e2e-tag-report.js [path-to-tests/e2e]");
  process.exit(1);
}

function findSpecFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...findSpecFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
      out.push(full);
    }
  }
  return out;
}

function parseSourceFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function literalText(node) {
  // Covers plain string literals and template literals with no `${}`.
  if (node && STRING_LITERAL_LIKE_KINDS.has(node.kind)) {
    return node.text;
  }
  return undefined;
}

function isTestCallee(expr) {
  if (expr.kind === ts.SyntaxKind.Identifier && expr.text === "test") {
    return true;
  }
  if (expr.kind === ts.SyntaxKind.PropertyAccessExpression) {
    const target = expr.expression;
    const isTestBase =
      target.kind === ts.SyntaxKind.Identifier && target.text === "test";
    const isSkipOrOnly =
      expr.name.text === "skip" || expr.name.text === "only";
    if (isTestBase && isSkipOrOnly) {
      return true;
    }
  }
  return false;
}

function hasCallback(args) {
  return args.some((arg) => FUNCTION_LIKE_KINDS.has(arg.kind));
}

// Reads an array of tag identifiers (and at most one `...spread`), resolving
// identifiers through tagMap.
function extractTagIdentifiers(arrayLiteral, tagMap) {
  const tags = [];
  let spreadName;
  for (const el of arrayLiteral.elements) {
    if (el.kind === ts.SyntaxKind.Identifier) {
      if (tagMap.has(el.text)) {
        tags.push(tagMap.get(el.text));
      } else {
        tags.push(`${el.text} [unknown tag]`);
      }
    } else if (el.kind === ts.SyntaxKind.SpreadElement) {
      if (el.expression.kind === ts.SyntaxKind.Identifier) {
        spreadName = el.expression.text;
      }
    }
  }
  return { tags, spreadName };
}

function findTagArrayLiteral(args) {
  for (const arg of args) {
    if (arg.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
      continue;
    }
    for (const prop of arg.properties) {
      if (prop.kind !== ts.SyntaxKind.PropertyAssignment) {
        continue;
      }
      if (prop.name.getText() !== "tag") {
        continue;
      }
      if (prop.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression) {
        return prop.initializer;
      }
    }
  }
  return undefined;
}

// Walks up from a test() call to see if it's the body of a
// `for (const {...} of someArray) { test(...) }` loop, stopping early if it
// crosses into a different function scope first (e.g. a describe() callback).
function findEnclosingForOf(node) {
  let cur = node.parent;
  while (cur && cur.kind !== ts.SyntaxKind.SourceFile) {
    if (cur.kind === ts.SyntaxKind.ForOfStatement) {
      return cur;
    }
    if (FUNCTION_LIKE_KINDS.has(cur.kind)) {
      return undefined;
    }
    cur = cur.parent;
  }
  return undefined;
}

function findTopLevelArray(sourceFile, name) {
  let found;
  function visit(node) {
    if (found) {
      return;
    }
    if (
      node.kind === ts.SyntaxKind.VariableDeclaration &&
      node.name.kind === ts.SyntaxKind.Identifier &&
      node.name.text === name &&
      node.initializer
    ) {
      let init = node.initializer;
      if (init.kind === ts.SyntaxKind.AsExpression) {
        init = init.expression; // unwrap `as const`
      }
      if (init.kind === ts.SyntaxKind.ArrayLiteralExpression) {
        found = init;
      }
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  }
  visit(sourceFile);
  return found;
}

function getObjectProp(obj, name) {
  for (const prop of obj.properties) {
    if (
      prop.kind === ts.SyntaxKind.PropertyAssignment &&
      prop.name.getText() === name
    ) {
      return prop.initializer;
    }
  }
  return undefined;
}

function recordEntry(entryName, tags, filePath, byTag, tagOrder) {
  const entry = `${entryName}  (${filePath})`;
  if (tags.length === 0) {
    byTag.get(NO_TAGS).push(entry);
    return;
  }
  for (const tag of tags) {
    if (!byTag.has(tag)) {
      byTag.set(tag, []);
      tagOrder.push(tag); // surface unexpected tags rather than dropping them
    }
    byTag.get(tag).push(entry);
  }
}

function resolveDirectName(nameArg) {
  const lit = literalText(nameArg);
  if (lit !== undefined) {
    return lit;
  }
  if (nameArg.kind === ts.SyntaxKind.Identifier) {
    return `${nameArg.text} [unresolved identifier]`;
  }
  return "[unresolved test name]";
}

function resolveDirectTags(tagArrayLiteral, tagMap) {
  if (!tagArrayLiteral) {
    return [];
  }
  const { tags, spreadName } = extractTagIdentifiers(tagArrayLiteral, tagMap);
  if (spreadName) {
    tags.push(`...${spreadName} [unresolved spread]`);
  }
  return tags;
}

function handleDirectTestCall(
  nameArg,
  tagArrayLiteral,
  tagMap,
  byTag,
  tagOrder,
  filePath,
) {
  const name = resolveDirectName(nameArg);
  const tags = resolveDirectTags(tagArrayLiteral, tagMap);
  recordEntry(name, tags, filePath, byTag, tagOrder);
}

function resolveLoopedName(nameArg, element) {
  const lit = literalText(nameArg);
  if (lit !== undefined) {
    return lit;
  }
  if (nameArg.kind === ts.SyntaxKind.Identifier) {
    const propLit = literalText(getObjectProp(element, nameArg.text));
    if (propLit !== undefined) {
      return propLit;
    }
    return `${nameArg.text} [unresolved]`;
  }
  return "[unresolved test name]";
}

function resolveLoopedTags(tagArrayLiteral, element, tagMap) {
  if (!tagArrayLiteral) {
    return [];
  }
  const { tags, spreadName } = extractTagIdentifiers(tagArrayLiteral, tagMap);
  if (spreadName) {
    const spreadInit = getObjectProp(element, spreadName);
    if (spreadInit && spreadInit.kind === ts.SyntaxKind.ArrayLiteralExpression) {
      return tags.concat(extractTagIdentifiers(spreadInit, tagMap).tags);
    }
  }
  return tags;
}

// Resolves a test() call sitting inside `for (const {...} of scenarios) {}`
// by reading each scenario object's properties. Returns false (and does
// nothing) if the loop shape isn't one this script understands, so the
// caller can fall back to direct resolution.
function handleLoopedTestCall(
  forOf,
  sourceFile,
  nameArg,
  tagArrayLiteral,
  tagMap,
  byTag,
  tagOrder,
  filePath,
) {
  const declList = forOf.initializer;
  let binding;
  if (
    declList.kind === ts.SyntaxKind.VariableDeclarationList &&
    declList.declarations.length === 1
  ) {
    binding = declList.declarations[0].name;
  }

  let arrayLiteral;
  if (forOf.expression.kind === ts.SyntaxKind.Identifier) {
    arrayLiteral = findTopLevelArray(sourceFile, forOf.expression.text);
  } else if (forOf.expression.kind === ts.SyntaxKind.ArrayLiteralExpression) {
    arrayLiteral = forOf.expression;
  }

  if (
    !binding ||
    binding.kind !== ts.SyntaxKind.ObjectBindingPattern ||
    !arrayLiteral
  ) {
    return false;
  }

  for (const element of arrayLiteral.elements) {
    if (element.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
      continue;
    }
    const name = resolveLoopedName(nameArg, element);
    const tags = resolveLoopedTags(tagArrayLiteral, element, tagMap);
    recordEntry(name, tags, filePath, byTag, tagOrder);
  }

  return true;
}

function handleTestCall(node, sourceFile, filePath, tagMap, byTag, tagOrder) {
  const args = node.arguments;
  const nameArg = args[0];
  const tagArrayLiteral = findTagArrayLiteral(args);
  const forOf = findEnclosingForOf(node);

  if (forOf) {
    const handled = handleLoopedTestCall(
      forOf,
      sourceFile,
      nameArg,
      tagArrayLiteral,
      tagMap,
      byTag,
      tagOrder,
      filePath,
    );
    if (handled) {
      return;
    }
  }

  handleDirectTestCall(nameArg, tagArrayLiteral, tagMap, byTag, tagOrder, filePath);
}

function collectTestEntriesFromFile(sourceFile, filePath, tagMap, byTag, tagOrder) {
  function visit(node) {
    if (
      node.kind === ts.SyntaxKind.CallExpression &&
      isTestCallee(node.expression) &&
      hasCallback(node.arguments)
    ) {
      handleTestCall(node, sourceFile, filePath, tagMap, byTag, tagOrder);
      return; // don't descend into the test body looking for nested calls
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

// Builds CONST_NAME -> "@tag-value" from tags.ts's enums, in declaration order.
function buildTagMap(tagsSourceFile) {
  const tagMap = new Map();
  const tagOrder = [];
  function visit(node) {
    if (node.kind === ts.SyntaxKind.EnumDeclaration) {
      for (const member of node.members) {
        const key = member.name.getText(tagsSourceFile);
        if (
          member.initializer &&
          member.initializer.kind === ts.SyntaxKind.StringLiteral
        ) {
          tagMap.set(key, member.initializer.text);
          tagOrder.push(member.initializer.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tagsSourceFile);
  return { tagMap, tagOrder };
}

function printReport(tagOrder, byTag) {
  const rule = "=".repeat(72);

  console.log(rule);
  console.log("E2E TEST TAG COUNTS");
  console.log(rule);
  for (const tag of [...tagOrder, NO_TAGS]) {
    console.log(`  ${tag.padEnd(24)} ${byTag.get(tag).length}`);
  }

  console.log("");
  console.log(rule);
  console.log("E2E TESTS BY TAG");
  console.log(rule);
  for (const tag of [...tagOrder, NO_TAGS]) {
    const list = byTag.get(tag);
    const header = `${tag} (${list.length})`;
    console.log(`\n${header}`);
    console.log("-".repeat(header.length));
    if (list.length > 0) {
      for (const entry of list) {
        console.log(`  - ${entry}`);
      }
    } else {
      console.log("  (none)");
    }
  }
}

// --- Main ----------------------------------------------------------------

const e2eDir = process.argv[2] || DEFAULT_E2E_DIR;
if (!fs.existsSync(e2eDir) || !fs.statSync(e2eDir).isDirectory()) {
  throwError(`e2e directory not found at '${e2eDir}'`);
}

const tagsFile = path.join(e2eDir, "tags.ts");
if (!fs.existsSync(tagsFile)) {
  throwError(`tags file not found at '${tagsFile}'`);
}

const specFiles = findSpecFiles(e2eDir).sort();
if (specFiles.length === 0) {
  throwError(`no *.spec.ts files found under '${e2eDir}'`);
}

const { tagMap, tagOrder } = buildTagMap(parseSourceFile(tagsFile));

const byTag = new Map();
for (const tag of [...tagOrder, NO_TAGS]) {
  byTag.set(tag, []);
}

for (const filePath of specFiles) {
  const sourceFile = parseSourceFile(filePath);
  collectTestEntriesFromFile(sourceFile, filePath, tagMap, byTag, tagOrder);
}

printReport(tagOrder, byTag);
