import { test, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(__dirname, "..");
const skillBody = readFileSync(resolve(skillDir, "SKILL.md"), "utf8");

function frontmatter(md: string): string {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("no frontmatter");
  return m[1];
}

test("Resend-pattern frontmatter — required keys present", () => {
  const fm = frontmatter(skillBody);
  for (const key of ["name:", "description:", "license:", "metadata:", "inputs:", "references:"]) {
    expect(fm.includes(key)).toBe(true);
  }
});

test("frontmatter declares all three operator inputs", () => {
  const fm = frontmatter(skillBody);
  for (const input of ["slack_channel", "prod_branch_glob", "cron_schedule"]) {
    expect(fm.includes(`name: ${input}`)).toBe(true);
  }
});

test("frontmatter declares required + optional binaries", () => {
  const fm = frontmatter(skillBody);
  expect(fm).toMatch(/bins: \[agentsfleet, gh, openssl, curl\]/);
  expect(fm).toMatch(/optional_bins: \[op\]/);
});

test("body does not hard-code any one host's question primitive", () => {
  const offenders = ["AskUserQuestion", "ClaudeAskUser"];
  for (const off of offenders) {
    const occurrences = skillBody.split(off).length - 1;
    expect(occurrences).toBeLessThanOrEqual(2);
  }
});

test("every reference in frontmatter resolves to an existing file", () => {
  const fm = frontmatter(skillBody);
  const refs = fm.match(/references\/[a-z-]+\.md/g) ?? [];
  expect(refs.length).toBeGreaterThanOrEqual(3);
  for (const r of refs) {
    expect(existsSync(resolve(skillDir, r))).toBe(true);
  }
});

test("body uses canonical CLI verbs (add/show/delete) — no stale set/get", () => {
  expect(skillBody.includes("credential set")).toBe(false);
  expect(skillBody.includes("credential get")).toBe(false);
  expect(skillBody.includes("credential remove")).toBe(false);
});

test("body teaches `--data @-` not `--data '<JSON>'`", () => {
  expect(skillBody).toMatch(/credential add <name> --data @-/);
  const unsafeCount = (skillBody.match(/--data ['"]<JSON>['"]/g) ?? []).length;
  expect(unsafeCount).toBeLessThanOrEqual(2);
});

test("body covers every step in the install plan (1-12)", () => {
  for (let i = 1; i <= 12; i++) {
    expect(skillBody.includes(`${i}.`)).toBe(true);
  }
});

test("body length stays under 350 lines (RULE FLL)", () => {
  const lines = skillBody.split("\n").length;
  expect(lines).toBeLessThanOrEqual(350);
});

test("references docs cover the three contracts", () => {
  const credRes = readFileSync(resolve(skillDir, "references/credential-resolution.md"), "utf8");
  for (const cred of ["github", "fly", "slack", "upstash"]) {
    expect(credRes.includes(cred)).toBe(true);
  }
  const failModes = readFileSync(resolve(skillDir, "references/failure-modes.md"), "utf8");
  for (const step of ["1 — doctor", "3 — repo", "5 — webhook", "7 — template", "9 — gh api hook register", "10 — webhook self-test", "12 — smoke"]) {
    expect(failModes.includes(step)).toBe(true);
  }
  const selfManagedHandoff = readFileSync(resolve(skillDir, "references/self-managed-handoff.md"), "utf8");
  expect(selfManagedHandoff).toMatch(/never holds an LLM (api[_ ]?key|API key)/i);
});
