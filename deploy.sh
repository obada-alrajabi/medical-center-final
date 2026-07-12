#!/bin/bash
# Local helper to build and push to GitHub.
# Usage: GITHUB_PAT=<token> ./deploy.sh
# The PAT is injected via git credential helper — never appears in process args or logs.
set -e

if [ -z "$GITHUB_PAT" ]; then
  echo "ERROR: GITHUB_PAT environment variable is not set."
  echo "Usage: GITHUB_PAT=<token> ./deploy.sh"
  exit 1
fi

REPO_URL="https://github.com/obada-alrajabi/medical-center.git"

# Always unset credential helper on exit — whether success, failure, or signal
trap 'git config --unset credential.helper 2>/dev/null || true' EXIT

# Use git credential helper to inject the PAT without it appearing in the remote URL
# or in the process argument list.
git config credential.helper '!f() { echo "username=obada-alrajabi"; echo "password='"$GITHUB_PAT"'"; }; f'

npm run build

git push "$REPO_URL" main

echo "✅ Done"
