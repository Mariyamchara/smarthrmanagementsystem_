import fs from "fs";
import path from "path";

const viteChunkPath = path.join(
  process.cwd(),
  "node_modules",
  "vite",
  "dist",
  "node",
  "chunks",
  "node.js"
);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(viteChunkPath)) {
  fail(`Vite chunk not found: ${viteChunkPath}`);
} else {
  const original = fs.readFileSync(viteChunkPath, "utf8");
  const marker = 'exec("net use",';

  if (!original.includes(marker)) {
    // Already patched or Vite changed implementation.
    console.log("Vite net-use patch: not needed");
  } else {
    const start = original.indexOf(marker);
    const end = original.indexOf("});", start);

    if (end === -1) {
      fail("Vite net-use patch: could not locate end of exec block");
    } else {
      const lineStart = original.lastIndexOf("\n", start) + 1;
      const indentMatch = original.slice(lineStart, start).match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : "";

      const replacement =
        `${indent}safeRealpathSync = fs.realpathSync.native;\n` +
        `${indent}return;\n`;

      const patched =
        original.slice(0, start) +
        replacement +
        original.slice(end + 3);

      fs.writeFileSync(viteChunkPath, patched, "utf8");
      console.log("Vite net-use patch: applied");
    }
  }
}

