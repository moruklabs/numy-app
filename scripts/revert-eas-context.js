const fs = require("fs");
const path = require("path");

const appsDir = path.join(__dirname, "../apps");
const apps = fs.readdirSync(appsDir);

apps.forEach((app) => {
  const appPath = path.join(appsDir, app);

  // Skip if not a directory
  try {
    if (!fs.statSync(appPath).isDirectory()) return;
  } catch {
    return;
  }

  const easPath = path.join(appPath, "eas.json");
  if (!fs.existsSync(easPath)) return;

  try {
    console.log(`Reverting ${app}...`);
    const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));

    // Remove context from profiles
    ["development", "preview", "production"].forEach((profile) => {
      if (eas.build?.[profile]) {
        if (eas.build[profile].context) delete eas.build[profile].context;
        if (eas.build[profile].ios?.context) delete eas.build[profile].ios.context;
        if (eas.build[profile].android?.context) delete eas.build[profile].android.context;
      }
    });

    fs.writeFileSync(easPath, JSON.stringify(eas, null, 2) + "\n");
  } catch (error) {
    console.error(`Failed to process ${easPath}:`, error.message);
  }
});

console.log("Done!");
