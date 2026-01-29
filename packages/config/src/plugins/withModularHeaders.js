const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to fix modular header issues.
 * This is required when using certain Firebase pods that depend on non-modular headers.
 */
module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, "ios", "Podfile");
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, "utf8");

        // --- ADD FIREBASE STATIC FRAMEWORK CONFIG ---
        // Only add if not already present (idempotent)
        if (!podfileContent.includes("$RNFirebaseAsStaticFramework")) {
          const platformMatch = podfileContent.match(/^platform :ios, .*/m);
          if (platformMatch) {
            const platformLine = platformMatch[0];
            const firebaseConfig = `

$RNFirebaseAsStaticFramework = true
use_modular_headers!
`;
            podfileContent = podfileContent.replace(platformLine, platformLine + firebaseConfig);
          }
        }

        // --- POST_INSTALL PATCH ---
        if (!podfileContent.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
          const nonModularFix = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;

          // Use flexible regex that handles variable whitespace
          const postInstallRegex = /post_install\s+do\s*\|\s*installer\s*\|/;

          if (postInstallRegex.test(podfileContent)) {
            podfileContent = podfileContent.replace(
              postInstallRegex,
              `post_install do |installer|${nonModularFix}`
            );
          } else {
            // If post_install block doesn't exist, add it before the end of the target block or at the end
            podfileContent += `

post_install do |installer|${nonModularFix}
end
`;
          }
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }
      return config;
    },
  ]);
};
