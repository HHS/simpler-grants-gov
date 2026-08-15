const fs = require("fs");

const path = "src/generated/apiSchemas.zod.ts";
const contents = fs.readFileSync(path, "utf8");

fs.writeFileSync(path, `// @ts-nocheck\n${contents}`);
