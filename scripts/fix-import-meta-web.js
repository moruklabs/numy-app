#!/usr/bin/env node
/**
 * Post-build script to replace import.meta in web bundles
 * This fixes "Cannot use 'import.meta' outside a module" errors
 * by replacing import.meta.env with undefined
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const distDir = path.join(__dirname, "..", "dist");

// Find all JS files in the web bundle
const jsFiles = glob.sync("**/*.js", {
  cwd: path.join(distDir, "_expo", "static", "js", "web"),
  absolute: true,
});

let totalReplacements = 0;

jsFiles.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  const originalContent = content;

  // Replace import.meta.env with undefined
  content = content.replace(/import\.meta\.env/g, "undefined");
  // Replace import.meta.env.MODE with undefined
  content = content.replace(/import\.meta\.env\.MODE/g, "undefined");
  // Replace standalone import.meta with undefined (less common)
  content = content.replace(/\bimport\.meta\b(?!\.)/g, "undefined");

  if (content !== originalContent) {
    const replacements = (originalContent.match(/import\.meta/g) || []).length;
    totalReplacements += replacements;
    fs.writeFileSync(file, content, "utf8");
    console.log(`Fixed ${replacements} import.meta usage(s) in ${path.basename(file)}`);
  }
});

if (totalReplacements > 0) {
  console.log(`\n✅ Fixed ${totalReplacements} total import.meta usage(s) in web bundles`);
} else {
  console.log("ℹ️  No import.meta usage found in web bundles");
}
