/* eslint-disable @typescript-eslint/no-var-requires */
const { withXcodeProject, withDangerousMod } = require("expo/config-plugins");
const { resolve } = require("path");
const { readFileSync, writeFileSync, existsSync } = require("fs");

/**
 * Expo config plugin to fix non-modular header build errors with
 * @react-native-firebase when using `useFrameworks: "static"`.
 *
 * Problem: CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 * allows the include, but -Werror converts the remaining warning to an error.
 *
 * Fix: In addition to the global Xcode setting, patch the generated Podfile
 * to inhibit all warnings on RNFB pods (GCC_WARN_INHIBIT_ALL_WARNINGS = YES).
 */
module.exports = function withModularHeaders(config) {
  // 1. Set the global Xcode build setting (existing behavior)
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings) {
        buildSettings.CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES =
          "YES";
      }
    }
    return config;
  });

  // 2. Patch Podfile post_install to suppress warnings on RNFB targets
  config = withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = resolve(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!existsSync(podfilePath)) {
        // Podfile not generated yet — skip; EAS prebuild will create it
        return config;
      }

      let podfile = readFileSync(podfilePath, "utf-8");

      const patchMarker = "# [withModularHeaders] RNFB warning suppression";

      if (podfile.includes(patchMarker)) {
        // Already patched
        return config;
      }

      // Insert our patch inside the post_install block
      const postInstallSnippet = `
    ${patchMarker}
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB') || target.name.start_with?('RNFBApp')
        target.build_configurations.each do |config|
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        end
      end
    end`;

      // Try to insert after `post_install do |installer|`
      const postInstallRegex =
        /(post_install\s+do\s+\|installer\|[^\n]*\n)/;

      if (postInstallRegex.test(podfile)) {
        podfile = podfile.replace(
          postInstallRegex,
          `$1${postInstallSnippet}\n`
        );
      } else {
        // If no post_install block exists, append one
        podfile += `\npost_install do |installer|\n${postInstallSnippet}\nend\n`;
      }

      writeFileSync(podfilePath, podfile, "utf-8");
      return config;
    },
  ]);

  return config;
};
