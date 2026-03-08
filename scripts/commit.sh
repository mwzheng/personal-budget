#!/usr/bin/env bash
set -euo pipefail

# scripts/commit.sh
# Helper to create commits where the body/footer may contain literal "\n" or "/n" sequences
# Usage:
#   ./scripts/commit.sh "<title>" "<body with \n escapes>" "<footer with \n escapes>" -- <additional git args>
# Examples:
#   ./scripts/commit.sh "feat(api): add endpoint" "This is the body\nMore details" "Closes #123"
#   pnpm run gcommit -- "fix: typo" "One-line body"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <title> [body] [footer] [-- <git-args>]"
  exit 1
fi

title="$1"
body="${2-}"
footer="${3-}"

# Convert escaped backslash-n sequences (e.g. "\\n") into real newlines
# printf "%b" interprets backslash escapes
body=$(printf "%b" "$body")
footer=$(printf "%b" "$footer")

# Convert literal forward-slash + n sequences ("/n") into newlines as well
# Use bash parameter expansion (requires bash)
body=${body//\/n/$'\n'}
footer=${footer//\/n/$'\n'}

# If the script received a -- separator, shift arguments so remaining are git args
shift 3 || true

# Build the commit message in a temporary file and pass it to git commit -F
msgfile=$(mktemp /tmp/gitmsg.XXXXXX)
{
  printf "%s\n\n" "$title"
  if [ -n "$body" ]; then
    printf "%s\n\n" "$body"
  fi
  if [ -n "$footer" ]; then
    printf "%s\n" "$footer"
  fi
} > "$msgfile"

# Run git commit with the generated message file
git commit -F "$msgfile" "$@"

# Clean up
rm -f "$msgfile"
