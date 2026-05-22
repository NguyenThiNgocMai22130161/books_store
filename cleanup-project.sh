#!/bin/bash

# Script cleanup và tổ chức lại project structure
# Author: Kiro AI Assistant
# Date: May 20, 2026

echo "🧹 =========================================="
echo "   PROJECT CLEANUP & REORGANIZATION"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This script will:${NC}"
echo "  1. Update .gitignore"
echo "  2. Remove build folders from git (bin/, target/)"
echo "  3. Organize documentation into docs/ folder"
echo "  4. Backup react-components/"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🚀 Starting cleanup..."
echo ""

# Step 1: Backup current state
echo "📦 Step 1: Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backup_${timestamp}"
mkdir -p "$backup_dir"

# Backup important files
cp -r react-components "$backup_dir/" 2>/dev/null || true
cp .gitignore "$backup_dir/.gitignore.bak" 2>/dev/null || true

echo -e "${GREEN}✅ Backup created in $backup_dir/${NC}"
echo ""

# Step 2: Update .gitignore
echo "⚙️  Step 2: Updating .gitignore..."

# Check if entries already exist
if ! grep -q "# Build folders" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# ========================================
# Build folders (added by cleanup script)
# ========================================
/bin/
/target/
/frontend/node_modules/
/frontend/dist/
/frontend/build/

# ========================================
# IDE
# ========================================
/.vscode/
/.idea/
*.iml
*.ipr
*.iws

# ========================================
# OS
# ========================================
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# ========================================
# Application properties (sensitive)
# ========================================
src/main/resources/application.properties
!src/main/resources/application.properties.example

# ========================================
# Logs
# ========================================
*.log
logs/

# ========================================
# Temporary files
# ========================================
*.tmp
*.temp
EOF
    echo -e "${GREEN}✅ .gitignore updated${NC}"
else
    echo -e "${BLUE}ℹ️  .gitignore already has build folder entries${NC}"
fi
echo ""

# Step 3: Remove build folders from git
echo "🗑️  Step 3: Removing build folders from git..."

if [ -d "bin" ]; then
    git rm -r --cached bin/ 2>/dev/null && echo -e "${GREEN}✅ Removed bin/ from git${NC}" || echo -e "${BLUE}ℹ️  bin/ not in git${NC}"
fi

if [ -d "target" ]; then
    git rm -r --cached target/ 2>/dev/null && echo -e "${GREEN}✅ Removed target/ from git${NC}" || echo -e "${BLUE}ℹ️  target/ not in git${NC}"
fi

echo ""

# Step 4: Create docs folder structure
echo "📁 Step 4: Creating docs/ folder structure..."

mkdir -p docs/setup
mkdir -p docs/guides
mkdir -p docs/api
mkdir -p docs/components-backup

echo -e "${GREEN}✅ docs/ folders created${NC}"
echo ""

# Step 5: Move documentation files
echo "📝 Step 5: Moving documentation files..."

# Move to docs/setup/
[ -f "START_HERE.md" ] && mv START_HERE.md docs/setup/ && echo "  → START_HERE.md"
[ -f "SETUP_REACT_APP.md" ] && mv SETUP_REACT_APP.md docs/setup/ && echo "  → SETUP_REACT_APP.md"
[ -f "setup-react-app.sh" ] && mv setup-react-app.sh docs/setup/ && echo "  → setup-react-app.sh"

# Move to docs/guides/
[ -f "REFACTORING_SUMMARY.md" ] && mv REFACTORING_SUMMARY.md docs/guides/ && echo "  → REFACTORING_SUMMARY.md"
[ -f "SECURITY_CONFIG_GUIDE.md" ] && mv SECURITY_CONFIG_GUIDE.md docs/guides/ && echo "  → SECURITY_CONFIG_GUIDE.md"
[ -f "PROJECT_STATUS.md" ] && mv PROJECT_STATUS.md docs/guides/ && echo "  → PROJECT_STATUS.md"
[ -f "PROJECT_STRUCTURE_REVIEW.md" ] && mv PROJECT_STRUCTURE_REVIEW.md docs/guides/ && echo "  → PROJECT_STRUCTURE_REVIEW.md"

echo -e "${GREEN}✅ Documentation files moved${NC}"
echo ""

# Step 6: Handle react-components folder
echo "📦 Step 6: Backing up react-components/..."

if [ -d "react-components" ]; then
    # Move all files to backup
    mv react-components/* docs/components-backup/ 2>/dev/null
    rmdir react-components 2>/dev/null
    echo -e "${GREEN}✅ react-components/ backed up to docs/components-backup/${NC}"
else
    echo -e "${BLUE}ℹ️  react-components/ not found${NC}"
fi
echo ""

# Step 7: Create application.properties if needed
echo "⚙️  Step 7: Checking application.properties..."

if [ -f "application.properties.example" ] && [ ! -f "src/main/resources/application.properties" ]; then
    cp application.properties.example src/main/resources/application.properties
    echo -e "${GREEN}✅ Created application.properties from example${NC}"
    echo -e "${YELLOW}⚠️  Remember to update with your actual credentials!${NC}"
else
    echo -e "${BLUE}ℹ️  application.properties already exists or example not found${NC}"
fi
echo ""

# Step 8: Create README in docs/
echo "📝 Step 8: Creating docs/README.md..."

cat > docs/README.md << 'EOF'
# 📚 Documentation

## 📁 Folder Structure

```
docs/
├── setup/              # Setup guides and scripts
│   ├── START_HERE.md
│   ├── SETUP_REACT_APP.md
│   └── setup-react-app.sh
├── guides/             # Development guides
│   ├── REFACTORING_SUMMARY.md
│   ├── SECURITY_CONFIG_GUIDE.md
│   └── PROJECT_STATUS.md
├── api/                # API documentation
└── components-backup/  # Backup of original React components
```

## 🚀 Quick Start

1. Read `setup/START_HERE.md`
2. Run `setup/setup-react-app.sh`
3. Follow the instructions

## 📖 Guides

- **Refactoring Summary:** `guides/REFACTORING_SUMMARY.md`
- **Security Config:** `guides/SECURITY_CONFIG_GUIDE.md`
- **Project Status:** `guides/PROJECT_STATUS.md`

## 🔗 Links

- [Main README](../README.md)
- [Frontend README](../frontend/README.md)
EOF

echo -e "${GREEN}✅ docs/README.md created${NC}"
echo ""

# Step 9: Update main README
echo "📝 Step 9: Updating main README.md..."

if [ -f "README.md" ]; then
    # Backup original
    cp README.md "$backup_dir/README.md.bak"
    
    # Add documentation section if not exists
    if ! grep -q "## 📚 Documentation" README.md; then
        cat >> README.md << 'EOF'

## 📚 Documentation

All documentation has been organized in the `docs/` folder:

- **Setup Guides:** `docs/setup/`
- **Development Guides:** `docs/guides/`
- **API Documentation:** `docs/api/`
- **Component Backup:** `docs/components-backup/`

**Quick Start:** Read `docs/setup/START_HERE.md`

EOF
        echo -e "${GREEN}✅ README.md updated${NC}"
    else
        echo -e "${BLUE}ℹ️  README.md already has documentation section${NC}"
    fi
fi
echo ""

# Step 10: Create .gitattributes for better diffs
echo "⚙️  Step 10: Creating .gitattributes..."

cat > .gitattributes << 'EOF'
# Auto detect text files and perform LF normalization
* text=auto

# Source code
*.java text diff=java
*.js text
*.jsx text
*.ts text
*.tsx text
*.css text
*.scss text
*.html text
*.xml text
*.json text
*.md text

# Scripts
*.sh text eol=lf
*.bash text eol=lf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.pdf binary
*.jar binary
*.war binary
*.ear binary
EOF

echo -e "${GREEN}✅ .gitattributes created${NC}"
echo ""

# Final summary
echo ""
echo "🎉 =========================================="
echo "   CLEANUP COMPLETE!"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Changes made:${NC}"
echo "  1. ✅ .gitignore updated"
echo "  2. ✅ Build folders removed from git"
echo "  3. ✅ Documentation organized in docs/"
echo "  4. ✅ react-components/ backed up"
echo "  5. ✅ .gitattributes created"
echo ""
echo -e "${BLUE}📦 Backup location:${NC} $backup_dir/"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "  1. Review changes: git status"
echo "  2. Test your app: ./mvnw spring-boot:run"
echo "  3. Commit changes: git add . && git commit -m 'Cleanup project structure'"
echo ""
echo -e "${GREEN}📁 New structure:${NC}"
echo "  books_store_test2/"
echo "  ├── docs/              # All documentation"
echo "  ├── frontend/          # React app"
echo "  ├── src/               # Backend"
echo "  └── README.md          # Main readme"
echo ""
echo "Happy coding! 🚀"
echo ""
