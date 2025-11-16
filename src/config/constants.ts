// config/constants.ts
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_REPO_URL: string = "https://github.com/IsaacGemal/wikitok";
export const DEFAULT_REPO_NAME: string = "wikitok";
export const DEFAULT_REPO_OWNER: string = "IsaacGemal";
export const REPOS_ROOT: string = path.join(__dirname, "../../tempRepo");
