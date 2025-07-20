#!/bin/bash
MSG="$1"
DESCRIPTION="$2"
git add .
git commit -m "$MSG" -m "$DESCRIPTION"
git push origin
git push origi

# "git": "bash git-commit.sh",
# pnpm run git "(Git) title" "description"