const fs = require("fs");
const { importSPKI, jwtVerify } = require("jose");

const env = fs.readFileSync(".env.local", "utf8");
const mKey = env.match(/API_JWT_PUBLIC_KEY=\"([\s\S]*?)\"/);
const mTok = env.match(/E2E_USER_AUTH_TOKEN=([^\n]+)/);

if (!mKey || !mTok) {
  console.error("missing key or token");
  process.exit(1);
}

const pub = mKey[1];
const token = mTok[1];

(async () => {
  const key = await importSPKI(pub, "RS256");
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["RS256"],
    audience: "simpler-grants-api",
    issuer: "simpler-grants-api",
  });
  console.log("ok", payload.user_id, payload.email);
})();
