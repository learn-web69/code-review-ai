// Simple helper to skip config files
export function isConfigFile(filePath) {
  return (
    filePath.includes("config") ||
    filePath.includes(".eslintrc") ||
    filePath.includes(".prettierrc") ||
    filePath.includes("babel.config")
  );
}
