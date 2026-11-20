#!/usr/bin/env bash
# Runs when any Claude Code session opens in this repo. Picks the fixed start
# message from config.json and tells the assistant to show it word for word.
# Plain bash + sed only, so it works without Node or Python.

dir="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cfg="$dir/config.json"

get() {
  # Reads a flat "key": "value" string from config.json.
  [ -f "$cfg" ] || return 0
  sed -n "s/^[[:space:]]*\"$1\"[[:space:]]*:[[:space:]]*\"\(.*\)\"[[:space:]]*,\{0,1\}[[:space:]]*$/\1/p" "$cfg" | head -n 1
}

stage="$(get setup_stage)"
name="$(get assistant_name)"
business="$(get business_name)"
done_steps="$(get setup_steps_done)"
next_step="$(get next_step)"

if [ ! -f "$cfg" ] || [ -z "$stage" ] || [ "$stage" = "not_started" ]; then
  file="messages/first-run.md"
elif [ "$stage" = "complete" ]; then
  file="messages/welcome-back.md"
else
  file="messages/resume.md"
fi

cat <<MSG
SESSION START (from .claude/hooks/session-start.sh)
Rule 0: begin your first reply with the exact text of $file, unchanged,
with only these placeholders filled in:
  {{ASSISTANT_NAME}} = ${name:-your sales tracker assistant}
  {{BUSINESS}} = ${business:-your}
  {{DONE_STEPS}} = ${done_steps:-none yet}
  {{NEXT_STEP}} = ${next_step:-step 1, a few questions about your business}
Then respond to whatever the user wrote.
MSG
