// config/constants.js
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_REPO_URL = "https://github.com/IsaacGemal/wikitok";
export const DEFAULT_REPO_NAME = "wikitok";
export const DEFAULT_REPO_OWNER = "IsaacGemal";
export const REPOS_ROOT = path.join(__dirname, "../../tempRepo");
