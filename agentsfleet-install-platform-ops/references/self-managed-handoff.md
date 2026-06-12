# Reference — self-managed handoff

The install-skill is platform-managed by default. It never asks the
user about LLM provider, never holds an LLM API key, never writes to
`tenant_providers`. That is deliberate — self-managed setup is its own
operator-deliberate flow, separate from per-repo agent installation.

This document is the lookup the agent loads when the user asks
something like "I want to use my own Fireworks key" or "switch this
agent to Anthropic".

## What "self-managed" actually means

Bring Your Own Key. The user provisions their own LLM provider account
(Anthropic, Fireworks, OpenAI-compatible), stores the API key in the
workspace vault under a credential name they choose, and tells the
platform's tenant-provider resolver to route inference through that
credential instead of the platform-managed default.

Two visible effects after switching to self-managed:

- **Billing flips.** Inference cost lands on the user's provider
  account directly (the platform never sees the money). The
  platform's credit-pool stays for non-inference costs (per-request
  ingest, Redis fan-out, etc.) but inference is on the user's tab.
- **Frontmatter sentinels.** Every agent installed *after* the
  switch carries `model: ""` and `context_cap_tokens: 0` in its
  generated TRIGGER.md. The worker overlays the real values from
  `core.tenant_providers` at trigger time. Zombies installed *before*
  the switch keep their pinned values; the user can re-run the
  install-skill on each repo to re-pin against the new posture, or
  hand-edit the frontmatter if they prefer.

## The out-of-band setup, in three steps

```bash
# 1. Store the provider api_key in the workspace vault. Pick a name
#    that makes sense to you — the vault is yours. The skill doesn't
#    prescribe a convention here.
op read 'op://Personal/fireworks-prod/api_key' \
  | jq -Rn '{provider: "fireworks",
              api_key: input,
              model: "accounts/fireworks/models/kimi-k2.6"}' \
  | agentsfleet credential add fw-prod --data @-

# 2. Tell the tenant-provider resolver to use that credential.
agentsfleet tenant provider add --credential fw-prod

# 3. Verify the doctor block flipped to self-managed posture.
agentsfleet doctor --json | jq '.tenant_provider'
# Expect: { mode: "self_managed", provider: "fireworks",
#          model: "accounts/fireworks/models/kimi-k2.6",
#          context_cap_tokens: 256000, credential_ref: "fw-prod" }
```

After step 3, every subsequent `/agentsfleet-install-platform-ops` run
generates self-managed frontmatter automatically — the install-skill reads
doctor and branches on `mode`. No flag, no prompt.

## Why the install-skill stays out of this

If the install-skill held the LLM API key during the install flow:

- The api_key would cross the skill boundary (LLM-readable context).
  Even though hosts mostly run skills out-of-band, "out-of-band" is
  not a security boundary. Once the api_key is in a chat surface, it
  shows up in transcripts, history, ticket attachments.
- The install-skill would have to know the provider's vault layout,
  the model-cap origin, the context_cap_tokens for every supported
  model — all things `agentsfleet tenant provider add` already owns.
- Every host the skill runs in (Claude Code, Amp, Codex CLI,
  OpenCode) would need its own auth-store integration to resolve
  provider keys. Keeping it in `agentsfleet` means one integration.

The boundary is: **the install-skill orchestrates `agentsfleet`; it
never holds the secrets that `agentsfleet` operates on directly.**

## Switching back from self-managed to platform-managed

```bash
agentsfleet tenant provider delete
```

Doctor's next call will report `mode: platform`. Re-run the install
skill on each repo if you want the pinned frontmatter to reflect the
platform-managed model + cap; otherwise the self-managed sentinels keep
working (the worker resolves to the platform default at trigger time
when no `tenant_providers` row exists).

## What this reference does not cover

- Picking which provider to use — that's a product decision (cost,
  context window, model quality, region). The cap.json endpoint at
  `https://api.agentsfleet.net/_um/da5b6b3810543fe108d816ee972e4ff8/cap.json`
  lists every supported model with its context cap and per-token rate.
- Multi-provider routing — there is one active provider per tenant.
  Per-agent provider override is a future milestone.
- Provider auth troubleshooting — that's the provider's docs, not
  this skill's. `agentsfleet tenant provider add` validates the key
  before persisting; the failure surface there is provider-specific.
