const fs = require("fs");
const ts = require("typescript");
const YAML = require("yaml");

const OPENAPI_PATH = "../api/openapi.generated.yml";
const ZOD_PATH = "src/validation-schemas/apiSchemas.zod.ts";

const OPERATOR_EXPRESSIONS = {
  less_than: (left, right) => `${left} < ${right}`,
  less_than_or_equal: (left, right) => `${left} <= ${right}`,
  greater_than: (left, right) => `${left} > ${right}`,
  greater_than_or_equal: (left, right) => `${left} >= ${right}`,
  equal: (left, right) => `${left} === ${right}`,
  not_equal: (left, right) => `${left} !== ${right}`,
};

function getRelationalValidations() {
  const openApi = YAML.parse(fs.readFileSync(OPENAPI_PATH, "utf8"));
  const schemas = openApi.components?.schemas ?? {};

  return Object.entries(schemas)
    .filter(([, schema]) => schema["x-relational-validations"]?.length)
    .map(([schemaName, schema]) => ({
      schemaName,
      properties: schema.properties ?? {},
      validations: schema["x-relational-validations"],
    }));
}

function getSchemaTypes(schema) {
  const type = schema?.type;

  if (Array.isArray(type)) {
    return type.filter((value) => value !== "null");
  }

  return type ? [type] : [];
}

function getValueGuard(schema, expression) {
  const types = getSchemaTypes(schema);

  if (types.includes("string") && schema?.format === "date") {
    return `zod.string().date().safeParse(${expression}).success`;
  }

  if (types.includes("integer") || types.includes("number")) {
    return `typeof ${expression} === "number"`;
  }

  if (types.includes("string")) {
    return `typeof ${expression} === "string"`;
  }

  return null;
}

function getValidationGuards(leftSchema, rightSchema, left, right) {
  return [
    getValueGuard(leftSchema, left),
    getValueGuard(rightSchema, right),
  ].filter(Boolean);
}

function getValidationType(leftField, rightField, leftSchema, rightSchema) {
  const leftTypes = getSchemaTypes(leftSchema);
  const rightTypes = getSchemaTypes(rightSchema);

  const bothDates =
    leftTypes.includes("string") &&
    rightTypes.includes("string") &&
    leftSchema?.format === "date" &&
    rightSchema?.format === "date";

  if (bothDates) {
    return "date_order";
  }

  const leftNumeric =
    leftTypes.includes("integer") || leftTypes.includes("number");

  const rightNumeric =
    rightTypes.includes("integer") || rightTypes.includes("number");

  if (leftNumeric && rightNumeric) {
    return "numeric_order";
  }

  if (leftTypes.includes("string") && rightTypes.includes("string")) {
    return "string_order";
  }

  throw new Error(
    `Unable to determine relational validation type for ` +
      `${leftField} and ${rightField}`,
  );
}

function getTargetValidationType(
  targetField,
  leftField,
  rightField,
  validationType,
) {
  if (targetField === leftField) {
    return `${rightField}_${validationType}`;
  }

  if (targetField === rightField) {
    return `${leftField}_${validationType}`;
  }

  throw new Error(
    `Relational validation target field ${targetField} is not ` +
      `${leftField} or ${rightField}`,
  );
}

function buildSuperRefine(validations, properties) {
  const rules = validations
    .map((validation) => {
      const {
        left_field: leftField,
        operator,
        right_field: rightField,
      } = validation;

      const comparison = OPERATOR_EXPRESSIONS[operator];

      if (!comparison) {
        throw new Error(
          `Unsupported relational validation operator: ${operator}`,
        );
      }

      const leftSchema = properties[leftField];
      const rightSchema = properties[rightField];

      if (!leftSchema || !rightSchema) {
        throw new Error(
          `Relational validation references missing fields: ` +
            `${leftField}, ${rightField}`,
        );
      }

      const left = `data[${JSON.stringify(leftField)}]`;
      const right = `data[${JSON.stringify(rightField)}]`;

      const validationType = getValidationType(
        leftField,
        rightField,
        leftSchema,
        rightSchema,
      );

      const guards = getValidationGuards(leftSchema, rightSchema, left, right);

      const validComparison = comparison(left, right);

      const conditions = [
        `${left} != null`,
        `${right} != null`,
        ...guards,
        `!(${validComparison})`,
      ];

      const targetFields = [leftField, rightField];

      const issues = targetFields
        .map((field) => {
          const targetValidationType = getTargetValidationType(
            field,
            leftField,
            rightField,
            validationType,
          );

          return `
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: [${JSON.stringify(field)}],
          message: ${JSON.stringify(targetValidationType)},
        });`;
        })
        .join("");

      return `
    if (
      ${conditions.join(" &&\n      ")}
    ) {${issues}
    }`;
    })
    .join("\n");

  return `.superRefine((data, ctx) => {${rules}
  })`;
}

function findGeneratedSchemaInitializers(sourceText) {
  const sourceFile = ts.createSourceFile(
    ZOD_PATH,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const initializers = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        initializers.set(declaration.name.text, {
          start: declaration.initializer.getStart(sourceFile),
          end: declaration.initializer.getEnd(),
        });
      }
    }
  }

  return initializers;
}

function addRelationalValidations(sourceText) {
  const relationalSchemas = getRelationalValidations();
  const initializers = findGeneratedSchemaInitializers(sourceText);

  const replacements = [];

  for (const { schemaName, validations, properties } of relationalSchemas) {
    const initializer = initializers.get(schemaName);

    if (!initializer) {
      console.warn(
        `Could not find generated Zod schema for OpenAPI schema: ${schemaName}`,
      );
      continue;
    }

    replacements.push({
      start: initializer.start,
      end: initializer.end,
      replacement:
        sourceText.slice(initializer.start, initializer.end) +
        buildSuperRefine(validations, properties),
    });
  }

  // Work backwards so earlier string positions aren't changed by later replacements.
  replacements.sort((a, b) => b.start - a.start);

  let result = sourceText;

  for (const replacement of replacements) {
    result =
      result.slice(0, replacement.start) +
      replacement.replacement +
      result.slice(replacement.end);
  }

  return result;
}

let contents = fs.readFileSync(ZOD_PATH, "utf8");

contents = addRelationalValidations(contents);

if (!contents.startsWith("// @ts-nocheck")) {
  contents = `// @ts-nocheck\n${contents}`;
}

fs.writeFileSync(ZOD_PATH, contents);
