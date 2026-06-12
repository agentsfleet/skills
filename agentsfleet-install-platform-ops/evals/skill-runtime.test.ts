// Runtime-behavior pin tests for the install-skill body. SKILL.md is prose
// that a host LLM (Claude Code / Amp / Codex CLI / OpenCode) interprets to
// execute the install plan — there is no Node.js runtime executing the
// steps, so "runtime behavior" tests pin the canonical prose the LLM reads
// at each decision point. A drift in any of these strings = a drift in what
// the LLM does at that step.
//
// TRIGGER.md template assertions from the original Node:test suite stayed
// in agentsfleet (samples/platform-ops/TRIGGER.md lives there, not in this
// repo). See agentsfleet's tests/template-substitution/ for that surface.

import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(__dirname, "..");
const skillBody = readFileSync(resolve(skillDir, "SKILL.md"), "utf8");

test("s1.0 — precondition check command + stop-on-miss prose", () => {
  expect(skillBody).toMatch(/which agentsfleet && which gh && agentsfleet doctor --json/);
  expect(skillBody).toMatch(/Any miss → print the exact one-liner above to fix it and stop\./);
});

test("s1.0 — missing-agentsfleet remediation: npm install one-liner", () => {
  expect(skillBody).toMatch(/npm install -g @agentsfleet\/cli/);
  const installIdx = skillBody.indexOf("npm install -g @agentsfleet/cli");
  const stopIdx = skillBody.indexOf("Any miss → print the exact one-liner above");
  expect(installIdx).toBeGreaterThan(-1);
  expect(stopIdx).toBeGreaterThan(-1);
  expect(installIdx).toBeLessThan(stopIdx);
});

test("s1.0 — missing-gh-scope remediation: gh auth refresh one-liner", () => {
  expect(skillBody).toMatch(/gh auth login -s admin:repo_hook/);
  expect(skillBody).toMatch(/gh auth refresh -s admin:repo_hook/);
});

test("s1.8 — parses triggers[] from rendered TRIGGER.md, skips non-webhook for s1.9", () => {
  expect(skillBody).toMatch(/extract\s+`x-agentsfleet\.triggers\[\]`/);
  expect(skillBody).toMatch(/Skip non-webhook entries\s+\(cron \/ api\)/);
});

test("s1.9 — gh api invocation template carries every load-bearing field", () => {
  expect(skillBody).toMatch(/gh api -X POST "repos\/\$\{GH_REPO\}\/hooks"/);
  for (const field of [
    "--field name=web",
    "--field active=true",
    "events[]",
    'config[url]=${WEBHOOK_URL}',
    "config[content_type]=json",
    "config[secret]=${WEBHOOK_SECRET}",
  ]) {
    expect(skillBody.includes(field)).toBe(true);
  }
});

test("s1.9 — 422 hook-exists is idempotent: GET hooks, match URL, advance", () => {
  expect(skillBody).toMatch(/422 Hook already exists/);
  expect(skillBody).toMatch(/idempotent:\s*`gh api\s*[\r\n]?\s*repos\/\$\{GH_REPO\}\/hooks`\s*\(GET\)/);
  expect(skillBody).toMatch(/matches\s+`\$\{WEBHOOK_URL\}`/);
});

test("s1.9 — 403/401 = missing scope; print refresh one-liner and stop", () => {
  expect(skillBody).toMatch(/`403`\s*\/\s*`401`\s*\(missing scope\)/);
  expect(skillBody).toMatch(/gh auth refresh -s admin:repo_hook/);
  expect(skillBody).toMatch(/Never silently\s*retry a failed step/);
});

test("s1.10 — HMAC self-verify block: openssl + curl + 202 + stop-on-mismatch", () => {
  expect(skillBody).toMatch(/compute HMAC-SHA256 of a synthetic payload/);
  expect(skillBody).toMatch(/openssl dgst -sha256 -hmac "\$WEBHOOK_SECRET"/);
  expect(skillBody).toMatch(/X-Hub-Signature-256:\s*sha256=\$\{SIG\}/);
  expect(skillBody).toMatch(/curl -fsS -X POST "\$\{WEBHOOK_URL\}"/);
  expect(skillBody).toMatch(/Expect HTTP\s+`202`/);
  expect(skillBody).toMatch(/On non-202, network failure, or\s*HMAC mismatch, print the response verbatim and stop/);
});
