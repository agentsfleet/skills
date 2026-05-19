// LLM-judge prose-clarity eval — runs the install-skill body through a
// language model and scores how clearly it would walk a user through the
// install. Expensive (5 trials, model-call each) and non-deterministic, so
// it's gated behind a nightly env flag and skipped by default. Per spec
// acceptance: average score ≥ 7/10 over 5 trials.

import { test } from "bun:test";

const NIGHTLY_GATE = process.env.SKILL_EVAL_LLM_JUDGE === "1";

test.skipIf(!NIGHTLY_GATE)("LLM-judge clarity ≥ 7/10 over 5 trials (nightly only)", async () => {
  // Implementation lands when the eval runner does. The contract:
  //   1. Load ../SKILL.md as the system prompt.
  //   2. Send a synthetic user prompt: "I want to install platform-ops on
  //      this repo, walk me through it."
  //   3. Score the agent's first response on (a) does it run doctor first,
  //      (b) does it ask for slack_channel/prod_branch_glob/cron_schedule,
  //      (c) does it teach `--data @-`, (d) does it self-test the webhook
  //      via gh + HMAC before declaring success. Each criterion is 0-2.5;
  //      average ≥ 7 to pass.
  //   4. Run 5 trials; assert average ≥ 7.
  throw new Error("nightly LLM-judge runner not yet implemented — unset SKILL_EVAL_LLM_JUDGE (or do not set it to 1) to skip");
});
