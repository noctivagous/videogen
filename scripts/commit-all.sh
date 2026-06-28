#!/usr/bin/env zsh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi

cd "$REPO_ROOT"

has_changes() {
  local dir="${1:-.}"
  git -C "$dir" status --porcelain | grep -q .
}

commit_repo() {
  local dir="$1"
  local name="$2"

  if ! has_changes "$dir"; then
    echo "✓ No changes in $name, skipping."
    return
  fi

  echo ""
  echo "━━━ Changes detected in $name ━━━"
  git -C "$dir" status --short
  echo ""

  echo -n "Commit message for $name: "
  IFS= read -r msg
  if [[ -z "$msg" ]]; then
    echo "✗ Cancelled — no message entered."
    exit 1
  fi

  git -C "$dir" add -A
  git -C "$dir" commit -m "$msg"
  echo "✓ $name committed."
}

SUBMODULE_PATH="$REPO_ROOT/PoseBlock"

if [[ -d "$SUBMODULE_PATH/.git" || -f "$SUBMODULE_PATH/.git" ]]; then
  commit_repo "$SUBMODULE_PATH" "PoseBlock (submodule)"
else
  echo "! PoseBlock submodule not initialized, skipping."
fi

commit_repo "$REPO_ROOT" "videogen"

echo ""
echo "━━━ Done ━━━"
echo "Remaining status:"
git status --short
echo ""
echo "Tip: run \`git push\` on each repo to push commits."
