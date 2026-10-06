#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="/home/ubuntu/tiny-courier-control"
readonly REPO="pranahonk/tiny-courier"
readonly BASE_URL="${MISSION_CONTROL_URL:-https://www.pwijaya.com}"
readonly SECRET="${MISSION_CONTROL_SYNC_SECRET:?MISSION_CONTROL_SYNC_SECRET is required}"
readonly GH="$ROOT/bin/gh"
readonly COORDINATOR="$ROOT/repo/scripts/vps-nightly-coordinator.sh"
readonly STOP_FILE="$ROOT/STOP_AUTOMATION"

api() {
  curl --fail --silent --show-error --retry 2 \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    "$@"
}

publish_status() {
  local runners cards prs runs next_run active_run result snapshot
  runners="$($GH api "repos/$REPO/actions/runners" --jq '[.runners[] | {name,status,busy}]')"
  cards="$($GH issue list --repo "$REPO" --state open --limit 100 --json number,title,labels,url \
    --jq '[.[] | {number,title,labels:[.labels[].name],url}]')"
  prs="$($GH pr list --repo "$REPO" --state open --limit 50 --json number,title,state,headRefName,url,statusCheckRollup \
    --jq '[.[] | {number,title,state,branch:.headRefName,url,checks:(if (.statusCheckRollup|length)==0 then "pending" elif any(.statusCheckRollup[]; .conclusion=="FAILURE" or .conclusion=="CANCELLED") then "failure" elif all(.statusCheckRollup[]; .conclusion=="SUCCESS" or .conclusion=="SKIPPED") then "success" else "pending" end)}]')"
  runs="$($GH run list --repo "$REPO" --limit 12 --json name,conclusion,status,url,createdAt \
    --jq '[.[] | {name,conclusion:(.conclusion // ""),status,url,createdAt}]')"
  next_run="$(systemctl show tiny-courier-nightly.timer -p NextElapseUSecRealtime --value || true)"
  active_run="$(systemctl is-active tiny-courier-nightly.service 2>/dev/null || true)"
  result="$(systemctl show tiny-courier-nightly.service -p Result --value || true)"

  snapshot="$(jq -n \
    --arg generatedAt "$(date --iso-8601=seconds)" \
    --argjson paused "$(test -f "$STOP_FILE" && echo true || echo false)" \
    --arg service "$(systemctl is-active tiny-courier-nightly.service 2>/dev/null || true)" \
    --arg timer "$(systemctl is-active tiny-courier-nightly.timer 2>/dev/null || true)" \
    --arg nextRun "$next_run" \
    --arg activeRun "$active_run" \
    --arg lastResult "$result" \
    --argjson runners "$runners" \
    --argjson cards "$cards" \
    --argjson prs "$prs" \
    --argjson runs "$runs" \
    '{
      generatedAt:$generatedAt,
      coordinator:{paused:$paused,service:$service,timer:$timer,nextRun:(if $nextRun=="" then null else $nextRun end),activeRun:$activeRun,lastResult:$lastResult},
      runners:$runners,
      cards:$cards,
      pullRequests:$prs,
      recentRuns:$runs,
      hosts:([
        {name:"VPS Control",role:"Coordinator",status:"online"},
        ($runners[] | {name:.name,role:(if .name=="MSI-Tiny-Courier" then "Windows + Android" else "iOS build" end),status:.status})
      ])
    }')"

  api -X POST --data "$snapshot" "$BASE_URL/api/tiny-courier/sync/status" >/dev/null
}

update_command() {
  local id="$1" state="$2" message="$3"
  api -X POST --data "$(jq -n --arg state "$state" --arg message "$message" '{state:$state,message:$message}')" \
    "$BASE_URL/api/tiny-courier/sync/commands/$id" >/dev/null
}

# One bad command (curl blip, gh failure) must not abort the remaining queue
# or skip publish_status. set -e stays on everywhere else.
run_command() {
  run_command_inner "$1" || update_command "$(jq -r '.id' <<<"$1")" failed "Command execution failed"
}

run_command_inner() {
  local command="$1" id type issue message
  id="$(jq -r '.id' <<<"$command")"
  type="$(jq -r '.type' <<<"$command")"
  issue="$(jq -r '.issueNumber // empty' <<<"$command")"
  update_command "$id" running "Accepted by VPS"

  case "$type" in
    pause)
      touch "$STOP_FILE"
      message="Automation paused"
      ;;
    resume)
      rm -f "$STOP_FILE"
      message="Automation resumed"
      ;;
    run_now)
      if [[ -f "$STOP_FILE" ]]; then
        update_command "$id" failed "Automation is paused"
        return
      fi
      set +e
      "$COORDINATOR"
      local status=$?
      set -e
      if [[ "$status" != 0 ]]; then
        update_command "$id" failed "Development pass exited $status"
        return
      fi
      message="Development pass completed"
      ;;
    promote_ready)
      local labels
      labels="$($GH issue view "$issue" --repo "$REPO" --json labels --jq '[.labels[].name]')"
      if ! jq -e 'index("backlog") and index("risk-low") and (index("risk-high")|not) and (index("human-required")|not)' <<<"$labels" >/dev/null; then
        update_command "$id" failed "Issue is not an eligible low-risk backlog card"
        return
      fi
      $GH issue edit "$issue" --repo "$REPO" --remove-label backlog --add-label ready >/dev/null
      message="Issue #$issue promoted to ready"
      ;;
    move_backlog)
      local labels
      labels="$($GH issue view "$issue" --repo "$REPO" --json labels --jq '[.labels[].name]')"
      if ! jq -e 'index("ready")' <<<"$labels" >/dev/null; then
        update_command "$id" failed "Issue is not ready"
        return
      fi
      $GH issue edit "$issue" --repo "$REPO" --remove-label ready --add-label backlog >/dev/null
      message="Issue #$issue moved to backlog"
      ;;
    *)
      update_command "$id" failed "Unsupported command"
      return
      ;;
  esac

  update_command "$id" completed "$message"
}

# ponytail: label promote/move are not idempotent (re-promote after timeout
# double-promotes, but validation re-runs fail-closed on already-moved cards);
# per-step checkpointing in the VPS state dir if a real pass can exceed the 30-min
# stale window.

commands="$(api "$BASE_URL/api/tiny-courier/sync/commands")"
while IFS= read -r command; do
  [[ -n "$command" ]] && run_command "$command"
done < <(jq -c '.commands[]?' <<<"$commands")

publish_status
