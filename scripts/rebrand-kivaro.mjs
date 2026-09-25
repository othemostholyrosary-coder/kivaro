import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", ".next", "dist", "build"]);
const ignoredFiles = new Set(["LICENSE", "scripts/rebrand-kivaro.mjs"]);
const textExtensions = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".scss", ".html", ".yml", ".yaml", ".env", ".txt", ".prisma",
]);

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (!ignoredFiles.has(entry.name)) {
      const extension = path.extname(entry.name).toLowerCase();
      if (textExtensions.has(extension) || entry.name.startsWith(".env")) {
        const original = fs.readFileSync(fullPath, "utf8");
        const updated = original
          .replaceAll("Kivaro", "Kivaro")
          .replaceAll("KIVARO", "KIVARO")
          .replaceAll("kivaro", "kivaro");
        if (updated !== original) fs.writeFileSync(fullPath, updated);
      }
    }
  }
}

walk(root);

const publicDir = path.join(root, "public");
const oldLogo = path.join(publicDir, "kivaro.png");
if (fs.existsSync(oldLogo)) fs.unlinkSync(oldLogo);
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-labelledby="title desc"><title>Kivaro</title><desc>Geometric Kivaro mark</desc><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs><rect width="128" height="128" rx="30" fill="#111827"/><path d="M35 27h18v26l25-26h23L73 61l29 40H80L56 69l-3 3v29H35z" fill="url(#g)"/><circle cx="99" cy="29" r="7" fill="#f59e0b"/></svg>`;
fs.writeFileSync(path.join(publicDir, "kivaro.svg"), logo);

for (const file of ["src/app/layout.tsx", "src/components/layout/sidebar.tsx", "src/app/(auth)/login/page.tsx"]) {
  const fullPath = path.join(root, file);
  const content = fs.readFileSync(fullPath, "utf8").replaceAll("/kivaro.png", "/kivaro.svg");
  fs.writeFileSync(fullPath, content);
}

console.log("Rebranded application surfaces to Kivaro and generated public/kivaro.svg");
console.log("LICENSE was intentionally left unchanged to preserve upstream MIT attribution.");
