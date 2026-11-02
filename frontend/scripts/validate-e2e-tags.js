#!/usr/bin/env node
/**
 * Validates E2E test tags so a typo cannot silently shrink what a cadence runs
 * (Playwright's --grep happily matches fewer tests and still exits 0).
 *
 * Checks:
 *   1. Specs:     every Playwright test has exactly one execution tag and only
 *                 known tags. Reads `playwright test --list`, so tags set via
 *                 shared arrays or scenario loops are resolved correctly.
 *   2. Workflows: every @tag named in the workflow tag settings (playwright_tags,
 *                 test_group_tags) and their input descriptions is a known tag.
 *
 * The valid tags come from tests/e2e/tags.ts, the single source of truth.
 *
 * Usage (from frontend/):
 *   node scripts/validate-e2e-tags.js                    # run both checks
 *   node scripts/validate-e2e-tags.js --specs-only
 *   node scripts/validate-e2e-tags.js --workflows-only
 */
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const process = require("node:process");
const { spawnSync } = require("node:child_process");

// ---- Configuration: adjust these if the layout changes ---------------------
const FRONTEND_DIR = path.resolve(__dirname, "..");
const REPO_DIR = path.resolve(FRONTEND_DIR, "..");
const TAGS_FILE = path.join(FRONTEND_DIR, "tests/e2e/tags.ts");
const PLAYWRIGHT_CONFIG = "./tests/playwright.config.ts";
const EXECUTION_TAGS_ENUM = "validExecutionTags"; // exactly one per test
const FEATURE_TAGS_ENUM = "validFeatureTags"; // optional
const WORKFLOW_DIRS = [".github/workflows", ".github/actions"];
// Lines in workflow files that mention tags.
const WORKFLOW_TAG_LINE =
  /playwright_tags|test_group_tags|pipe separated list of @tags/;
// Prose that looks like a tag but is not one.
const NOT_TAGS = new Set(["@tags"]);
// ----------------------------------------------------------------------------

/** Reads the "@tag" string values of one enum in tags.ts. */
function readEnumValues(source, enumName) {
  const block = source.match(
    new RegExp(`enum\\s+${enumName}\\s*\\{([^}]*)\\}`),
  );
  if (!block) {
    throw new Error(`Could not find "enum ${enumName}" in ${TAGS_FILE}`);
  }
  const values = [...block[1].matchAll(/"(@[\w-]+)"/g)].map((m) => m[1]);
  if (values.length === 0) {
    throw new Error(`"enum ${enumName}" in ${TAGS_FILE} has no "@tag" values`);
  }
  return values;
}

function loadValidTags() {
  const source = fs.readFileSync(TAGS_FILE, "utf8");
  const execution = readEnumValues(source, EXECUTION_TAGS_ENUM);
  const feature = readEnumValues(source, FEATURE_TAGS_ENUM);
  return {
    execution: new Set(execution),
    all: new Set([...execution, ...feature]),
  };
}

/** Lists every test via Playwright, de-duplicated across browser projects. */
function listTests() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-tags-"));
  const outFile = path.join(outDir, "list.json");
  // The JSON reporter writes to a file, so any text printed to stdout while
  // the config loads cannot corrupt the report.
  const result = spawnSync(
    "npx",
    [
      "playwright",
      "test",
      "--config",
      PLAYWRIGHT_CONFIG,
      "--list",
      "--reporter=json",
    ],
    {
      cwd: FRONTEND_DIR,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: outFile },
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );
  if (result.status !== 0 || !fs.existsSync(outFile)) {
    throw new Error(
      `"playwright test --list" failed (exit ${result.status}):\n${result.stderr || result.stdout}`,
    );
  }
  const report = JSON.parse(fs.readFileSync(outFile, "utf8"));
  fs.rmSync(outDir, { recursive: true, force: true });
  if (report.errors && report.errors.length > 0) {
    throw new Error(
      `Playwright reported errors while listing tests:\n${report.errors
        .map((e) => e.message)
        .join("\n")}`,
    );
  }

  const tests = new Map();
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      tests.set(`${spec.file}:${spec.line}:${spec.title}`, spec);
    }
    (suite.suites || []).forEach(walk);
  };
  (report.suites || []).forEach(walk);
  return tests;
}

function validateSpecs(valid) {
  const errors = [];
  const tests = listTests();
  for (const spec of tests.values()) {
    const where = `${spec.file}:${spec.line}`;
    // Playwright reports tags without the leading "@".
    const tags = (spec.tags || []).map((t) => `@${t}`);
    for (const tag of tags.filter((t) => !valid.all.has(t))) {
      errors.push(`${where}  unknown tag ${tag}  ("${spec.title}")`);
    }
    const execution = tags.filter((t) => valid.execution.has(t));
    if (execution.length !== 1) {
      errors.push(
        `${where}  needs exactly one execution tag (${[...valid.execution].join(
          " or ",
        )}), found ${execution.length === 0 ? "none" : execution.join(", ")}  ("${spec.title}")`,
      );
    }
  }
  return { errors, summary: `${tests.size} tests checked` };
}

function* workflowFiles() {
  for (const dir of WORKFLOW_DIRS) {
    const root = path.join(REPO_DIR, dir);
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (/\.ya?ml$/.test(entry.name)) yield full;
      }
    }
  }
}

function validateWorkflows(valid) {
  const errors = [];
  let lineCount = 0;
  for (const file of workflowFiles()) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!WORKFLOW_TAG_LINE.test(line)) return;
      lineCount += 1;
      for (const [token] of line.matchAll(/@[A-Za-z][\w-]*/g)) {
        if (NOT_TAGS.has(token) || valid.all.has(token)) continue;
        errors.push(
          `${path.relative(REPO_DIR, file)}:${index + 1}  unknown tag ${token}`,
        );
      }
    });
  }
  return { errors, summary: `${lineCount} workflow tag lines checked` };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const runSpecs = !args.has("--workflows-only");
  const runWorkflows = !args.has("--specs-only");
  const valid = loadValidTags();
  console.log(`Valid tags: ${[...valid.all].join(", ")}`);

  const checks = [];
  if (runSpecs) checks.push(["Specs", validateSpecs(valid)]);
  if (runWorkflows) checks.push(["Workflows", validateWorkflows(valid)]);

  let failed = false;
  for (const [name, { errors, summary }] of checks) {
    if (errors.length === 0) {
      console.log(`OK    ${name}: ${summary}`);
      continue;
    }
    failed = true;
    console.error(`FAIL  ${name}: ${summary}, ${errors.length} problem(s)`);
    errors.forEach((e) => console.error(`  ${e}`));
  }
  process.exit(failed ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
