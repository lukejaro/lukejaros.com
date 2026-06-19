#!/usr/bin/env bash
# Create the "Lukejaros.com" GitHub Project and add all repo issues.
# Requires: gh auth refresh -h github.com -s project,read:project

set -euo pipefail

OWNER="lukejaro"
REPO="lukejaros.com"
PROJECT_TITLE="Lukejaros.com"

if ! gh auth status -h github.com 2>&1 | grep -q 'read:project\|project'; then
  echo "Missing GitHub project scope. Run:"
  echo "  gh auth refresh -h github.com -s project,read:project"
  exit 1
fi

echo "Creating project: $PROJECT_TITLE"
PROJECT_NUMBER=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json | jq -r .number)
echo "Project #$PROJECT_NUMBER created"

echo "Linking repository $OWNER/$REPO"
gh project link "$PROJECT_NUMBER" --owner "$OWNER" --repo "$OWNER/$REPO"

echo "Adding issues to project..."
gh issue list --repo "$OWNER/$REPO" --state all --limit 100 --json number -q '.[].number' | while read -r num; do
  gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "https://github.com/$OWNER/$REPO/issues/$num"
  echo "  Added issue #$num"
done

echo ""
echo "Done! Open the project:"
echo "  gh project view $PROJECT_NUMBER --owner $OWNER --web"