<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo/dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="assets/logo/light.svg" />
  <img src="assets/logo/dark.svg" width="200" alt="agentsfleet" />
</picture>

**Agent skills for agentsfleet — install, drive, and operate agents from any AI coding host.**

Long-lived runtimes that own one operational outcome end to end. These skills
teach Claude Code, Codex CLI, Amp, and OpenCode to drive `zombiectl`
non-interactively so your agent can install, steer, and inspect agents
without you reading every flag.

[![Docs](https://img.shields.io/badge/agentsfleet-Docs-5EEAD4?style=for-the-badge)](https://docs.agentsfleet.net)
[![Get early access](https://img.shields.io/badge/agentsfleet-Get_early_access-5EEAD4?style=for-the-badge)](https://agentsfleet.net)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

Skills here follow the [Agent Skills](https://agentskills.io/) format and work
with 18+ AI agent hosts including Claude Code, Codex CLI, Amp, OpenCode, and
Cursor.

### Install all agentsfleet skills

```bash
npx skills add agentsfleet/skills
```

This symlinks every top-level `usezombie-*` directory into each supported
host's skill path that exists on your machine (`~/.claude/skills/`,
`~/.codex/skills/`, `~/.amp/skills/`, `~/.opencode/skills/`).

### Install a single skill

```bash
npx skills add agentsfleet/skills --skill usezombie-install-platform-ops
```

### Claude Code Plugin

These skills also ship as a Claude Code plugin marketplace:

```bash
# 1. Register the marketplace
claude plugin marketplace add agentsfleet/skills

# 2. Install the plugin you want
claude plugin install usezombie-install-platform-ops@usezombie-skills
```

### Prerequisites

Most skills here drive `zombiectl`. Install it first:

```bash
npm install -g @usezombie/zombiectl
zombiectl auth login
```

## Available Skills

<details>
<summary><strong>usezombie-install-platform-ops</strong></summary>

One-command install of the platform-ops agent on a user's repo. Watches
GitHub Actions CD failures and posts evidenced diagnoses to Slack.

**Use when:**

- Setting up an agent on a new repo for the first time
- Resolving tool credentials (Fly, Slack, GitHub, Upstash) via 1Password / env / prompt
- Registering and HMAC-verifying webhooks from the user's local `gh`
- Smoke-testing the install with a real steer round-trip

**Slash-command:** `/usezombie-install-platform-ops`

</details>

## Usage

Skills are automatically available once installed. Invoke them by their
slash-command in any supported host:

```
/usezombie-install-platform-ops
```

The agent reads the skill body, walks the install plan, and surfaces every
failure mode verbatim so you can resolve it before retrying.

## Skill Structure

Each skill is a top-level directory matching its slash-command:

```
usezombie-install-platform-ops/
├── SKILL.md              # Frontmatter + body the host LLM reads
├── references/           # Detailed docs the skill loads on demand
│   ├── credential-resolution.md
│   ├── failure-modes.md
│   └── self-managed-handoff.md
└── evals/                # Pin-tests + LLM-judge harness (bun test)
    ├── package.json
    ├── tsconfig.json
    ├── skill-body.test.ts
    ├── skill-runtime.test.ts
    ├── repo-detection.test.ts
    ├── llm-judge.eval.ts
    └── fixtures/         # Synthetic repos for runtime assertions
```

The `SKILL.md` frontmatter follows the
[Agent Skills Open Standard](https://agentskills.io/) with `name`,
`description`, `license`, `metadata`, `inputs`, and `references`.

## Release model

`main` is the release surface. Push to `main` = ship. No tags, no semver —
same model as a dotfiles repo. `npx skills add agentsfleet/skills` always pulls
the latest commit.

## Contributing

Pull requests welcome. Each skill change runs evals on PR via
`.github/workflows/eval.yml` (Bun test runner). New skills should add a
top-level `<skill-name>/` directory with `SKILL.md`, `references/`, and
`evals/`, plus a matching entry in `.claude-plugin/marketplace.json`.

## License

MIT — Copyright (c) 2026 agentsfleet
