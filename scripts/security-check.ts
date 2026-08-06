import fs from "node:fs";
import path from "node:path";

const sourceRoots = ["app", "src", "scripts", "tests", "prompts", "schemas", "*.md"];
const secretPatterns = [
  { name: "OpenAI-like key", expression: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "AWS access key", expression: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "private key", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function collectFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(target) : [target];
  });
}

const files = [
  ...sourceRoots.filter((root) => !root.includes("*")).flatMap(collectFiles),
  ...fs.readdirSync(process.cwd()).filter((name) => name.endsWith(".md")),
].filter((file) => !file.includes("archive"));

const findings: string[] = [];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const pattern of secretPatterns) if (pattern.expression.test(content)) findings.push(`${pattern.name}: ${file}`);
}

if (findings.length > 0) {
  console.error("Potential committed secrets found:\n" + findings.join("\n"));
  process.exit(1);
}

console.log(`Secret-pattern scan passed for ${files.length} source and documentation files.`);
