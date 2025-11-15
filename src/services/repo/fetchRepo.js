/**
 * This script does the following:
 * 1. Clones a GitHub repository into a temporary folder
 * 2. Recursively reads all JS/TS files (can add other types if needed)
 * 3. Stores them in an array of objects {filePath, content}
 *
 * Why: We need access to all the code so that AI can perform
 * semantic analysis of changes and generate a walkthrough.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// --- Configuration ---
// Repository URL (can be replaced with any GitHub repo)
const REPO_URL = "https://github.com/facebook/react.git";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_PATH = path.join(__dirname, "../../../tempRepo");

// --- 1. Clone repository ---
if (!fs.existsSync(LOCAL_PATH)) {
  console.log(`Cloning repository ${REPO_URL}...`);
  execSync(`git clone ${REPO_URL} ${LOCAL_PATH}`, { stdio: "inherit" });
} else {
  console.log("Repository already cloned. Pulling latest changes...");
  execSync(`git -C ${LOCAL_PATH} pull`, { stdio: "inherit" });
}

// --- 2. Function to recursively collect JS/TS files ---
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".ts") ||
      file.endsWith(".jsx") ||
      file.endsWith(".tsx")
    ) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// --- 3. Read files and store them in an array ---
export const allCodeFiles = getAllFiles(LOCAL_PATH).map((filePath) => {
  return {
    filePath,
    content: fs.readFileSync(filePath, "utf-8"),
  };
});
