import fs from "node:fs";
import { execFileSync } from "node:child_process";

const secretPatterns = [
  { name: "OpenAI-like key", expression: /\bsk-[A-Za-z0-9_-]{20,}\b/, gitExpression: "sk-[A-Za-z0-9_-]{20,}" },
  { name: "AWS access key", expression: /\bAKIA[0-9A-Z]{16}\b/, gitExpression: "AKIA[0-9A-Z]{16}" },
  { name: "private key", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, gitExpression: "-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----" },
];

function gitOutput(args: string[]) {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const result = error as { status?: number; stdout?: Buffer | string };
    if (result.status === 1) return typeof result.stdout === "string" ? result.stdout : result.stdout?.toString("utf8") ?? "";
    throw error;
  }
}

const files = gitOutput(["ls-files", "-z"]).split("\0").filter(Boolean);

const findings: string[] = [];
for (const file of files) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile()) {
    findings.push(`Tracked non-regular file cannot be scanned safely: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  for (const pattern of secretPatterns) if (pattern.expression.test(content)) findings.push(`${pattern.name}: ${file}`);
}

const revisions = gitOutput(["rev-list", "--all"]).trim().split("\n").filter(Boolean);
for (const pattern of secretPatterns) {
  const matches = gitOutput(["grep", "-I", "-l", "-E", "-e", pattern.gitExpression, ...revisions]);
  for (const match of matches.trim().split("\n").filter(Boolean)) findings.push(`${pattern.name} in Git history: ${match}`);
}

if (findings.length > 0) {
  console.error("Potential committed secrets found (paths only; values are withheld):\n" + findings.join("\n"));
  process.exit(1);
}

console.log(`Secret-pattern scan passed for ${files.length} tracked files and ${revisions.length} reachable Git revisions.`);
