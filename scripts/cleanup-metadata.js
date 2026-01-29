const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "../apps/numy/store-metadata/locales");
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

if (!fs.existsSync(LOCALES_DIR)) {
  console.error(`Directory not found: ${LOCALES_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));

let modifiedCount = 0;

files.forEach((file) => {
  const filePath = path.join(LOCALES_DIR, file);
  const content = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(content);

  let modified = false;

  if (data.description && EMOJI_REGEX.test(data.description)) {
    // Replace emojis with empty string, but beware of double spaces
    data.description = data.description.replace(EMOJI_REGEX, "").replace(/\s+/g, " ").trim();
    modified = true;
  }

  // Also check title and keywords just in case, though the error was about description
  if (data.title && EMOJI_REGEX.test(data.title)) {
    data.title = data.title.replace(EMOJI_REGEX, "").trim();
    modified = true;
  }

  if (data.subtitle && EMOJI_REGEX.test(data.subtitle)) {
    data.subtitle = data.subtitle.replace(EMOJI_REGEX, "").trim();
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    console.log(`Cleaned ${file}`);
    modifiedCount++;
  }
});

console.log(`\nProcessed ${files.length} files.`);
console.log(`Cleaned ${modifiedCount} files.`);
