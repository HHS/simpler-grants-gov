const fs = require("fs");
const { createPrivateKey } = require("crypto");
const { SignJWT, importPKCS8 } = require("jose");

const env = fs.readFileSync("../api/override.env", "utf8");
const match = env.match(/API_JWT_PRIVATE_KEY=\"([\s\S]*?)\"/);
if (!match) {
  console.error("API_JWT_PRIVATE_KEY not found");
  process.exit(1);
}

const pkcs1Key = match[1];
const pkcs8Key = createPrivateKey(pkcs1Key)
  .export({ type: "pkcs8", format: "pem" })
  .toString();

const userId = "f15c7491-7ebc-4f4f-8de6-3ac0594d9c63";
const email = "maryadams@example.net";

(async () => {
  const key = await importPKCS8(pkcs8Key, "RS256");
  const token = await new SignJWT({
    email,
    user_id: userId,
    session_duration_minutes: 30,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setAudience("simpler-grants-api")
    .setIssuer("simpler-grants-api")
    .setSubject(userId)
    .setExpirationTime("30m")
    .sign(key);

  console.log(token);
})();
