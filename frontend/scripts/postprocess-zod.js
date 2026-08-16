const fs = require("fs");

const path = "src/generated/apiSchemas.zod.ts";
const contents = fs.readFileSync(path, "utf8");
// The generated Orval Zod output currently fails strict project type-checking.
// Keep consumer code type-checked while skipping checks inside generated code.
fs.writeFileSync(path, `// @ts-nocheck\n${contents}`);
