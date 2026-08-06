import fs from "node:fs";
import path from "node:path";
import { getAppConfig } from "../src/config/env";

const config = getAppConfig();
const bokExists = fs.existsSync(config.bokPath);
const voicePath = config.voiceSkillPath.startsWith("~/")
  ? path.join(process.env.HOME ?? "", config.voiceSkillPath.slice(2))
  : config.voiceSkillPath;

console.log(`BOK: ${bokExists ? "found" : "missing"} (${config.bokPath})`);
console.log(`Voice skill: ${fs.existsSync(voicePath) ? "found" : "missing"} (${voicePath})`);
console.log("Content parsing and FTS indexing begin in Milestone 2.");
process.exit(bokExists ? 0 : 1);
