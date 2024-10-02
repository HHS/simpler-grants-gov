import fs from "node:fs";
import path from "node:path";

// Helper function to list all paths recursively
export function listPaths(dir: string): string[] {
  let fileList: string[] = [];
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fileList = fileList.concat(listPaths(filePath));
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Function to get the Next.js routes
export function getNextRoutes(src: string): string[] {
  // Get all paths from the `app` directory
  const appPaths = listPaths(src).filter((file) => file.endsWith("page.tsx"));

  // Extract the route name for each `page.tsx` file
  // Basically anything between [locale] and /page.tsx is extracted,
  // which lets us get nested routes such as /newsletter/unsubscribe
  const appRoutes = appPaths.map((filePath) => {
    const relativePath = path.relative(src, filePath);
    const route = relativePath
      ? "/" +
        relativePath
          .replace("/page.tsx", "")
          .replace(/\[locale\]/g, "")
          .replace(/\\/g, "/")
          .replace(/\[id\]/g, "1") // for id-based routes like /opportunity/[id]
      : "/";
    return route.replace(/\/\//g, "/");
  });

  const filteredRoutes = appRoutes.filter((item) => item != "/[...not-found]");
  return filteredRoutes;
}
