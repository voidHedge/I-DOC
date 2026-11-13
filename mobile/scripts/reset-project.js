#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /src and /scripts directories to /example based on user input and creates a new /src/app directory with an index.tsx and _layout.tsx file.
 * Demo images in /assets/images are deleted or moved along with them.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["src", "scripts"];
const exampleDir = "example";
const newAppDir = "src/app";
const exampleDirPath = path.join(root, exampleDir);
// Demo images and folders used only by the files in /src
const exampleAssets = [
  "expo-badge.png",
  "expo-badge-white.png",
  "expo-logo.png",
  "logo-glow.png",
  "react-logo.png",
  "react-logo@2x.png",
  "react-logo@3x.png",
  "tutorial-web.png",
  "tabIcons",
];

const indexContent = `import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      await fs.promises.mkdir(path.join(exampleDirPath, "assets/images"), {
        recursive: true,
      });
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
        }
      } else {
      }
    }

    // Move demo assets to /example or delete them
    for (const asset of exampleAssets) {
      const assetPath = path.join(root, "assets/images", asset);
      if (fs.existsSync(assetPath)) {
        if (userInput === "y") {
          const newAssetPath = path.join(
            exampleDirPath,
            "assets/images",
            asset,
          );
          await fs.promises.rename(assetPath, newAssetPath);
        } else {
          await fs.promises.rm(assetPath, { recursive: true, force: true });
        }
      }
    }

    // Create new /src/app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  "Do you want to move existing files to /example instead of deleting them? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      rl.close();
    }
  },
);
