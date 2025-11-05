// storage-adapter-import-placeholder
import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
// import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./collections/Media";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URI || "",
    },
  }),
  sharp,
  plugins: [
    // payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
});
