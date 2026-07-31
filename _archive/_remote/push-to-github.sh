#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Sushaasan — Push organized files to GitHub
# Run this from the sushaasan-repo/ directory
# ═══════════════════════════════════════════════════════════

REPO_URL="https://github.com/harsh147-github/Project_Svyas.git"

echo "═══════════════════════════════════════════════════"
echo "  Sushaasan — GitHub Repository Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ git not found. Install git first."
    exit 1
fi

# Initialize if not already a git repo
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git remote add origin "$REPO_URL"
else
    echo "📁 Git repo already initialized."
fi

# Configure git (update with your details)
git config user.email "contact@sushaasan.in"
git config user.name "Harsh Sonavane"

# Stage all files
echo ""
echo "📦 Staging all files..."
git add -A

echo ""
echo "📋 Files to be committed:"
git status --short

# Commit
echo ""
echo "💾 Committing..."
git commit -m "📚 Organize Sushaasan documentation & pitch materials

- docs/research/: 6 research documents (competitive landscape, CPGRAMS,
  civic behavior, Sarvam AI playbook, engagement design, validation)
- docs/strategy/: 7 strategy documents (complete research & execution,
  vision & roadmap, action plan, executive brief, FAQ & objections,
  product vision, solution approaches)
- docs/outreach/: 2 outreach documents (Raghav Chadha MP emails)
- docs/funding/: Pre-seed funding roadmap (40+ opportunities)
- docs/pitch-materials/: 12-slide pitch deck (PPTX) + 18-page
  investor report with application copy-paste bank (PDF)
- Updated README with full project overview

Startup India BHASKAR ID: IN-0326-9427IW"

# Push
echo ""
echo "🚀 Pushing to GitHub..."
echo ""
echo "⚠️  You'll be prompted for GitHub credentials."
echo "   Use a Personal Access Token (PAT) as the password."
echo "   Generate one at: github.com/settings/tokens"
echo ""
git branch -M main
git push -u origin main --force

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Done! Check: $REPO_URL"
echo "═══════════════════════════════════════════════════"
