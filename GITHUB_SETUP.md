# GitHub Setup Guide

Quick guide to get your Blackjack Statistics app on GitHub and ready for deployment.

## Initial GitHub Setup

### 1. Create a GitHub Account
If you don't have one, sign up at [github.com](https://github.com)

### 2. Create a New Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `blackjack-statistics`
3. Description: `Educational blackjack app with statistical odds display`
4. Visibility: Public (required for free GitHub Pages)
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

### 3. Initialize Git in Your Project

Open terminal in your project directory and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - Blackjack Statistics app"

# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/blackjack-statistics.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Deploy to GitHub Pages (Optional)

GitHub Pages lets you host the web app for free.

### Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings"
3. Click "Pages" in the left sidebar
4. Under "Build and deployment":
   - Source: Select "GitHub Actions"
5. The `.github/workflows/deploy.yml` file will automatically deploy on push

### Update Vite Config for GitHub Pages

Edit `vite.config.js`:

```javascript
export default defineConfig({
  base: '/blackjack-statistics/', // Add this line (your repo name)
  plugins: [react()],
  // ... rest of config
})
```

Commit and push:

```bash
git add vite.config.js
git commit -m "Configure for GitHub Pages"
git push
```

### Access Your Deployed App

After the GitHub Action completes (~2 minutes):
- Your app will be live at: `https://YOUR_USERNAME.github.io/blackjack-statistics/`

## Working with Git

### Making Changes

```bash
# Make your code changes

# Check what changed
git status

# Add changed files
git add .

# Commit with a message
git commit -m "Description of changes"

# Push to GitHub
git push
```

### Common Git Commands

```bash
# See commit history
git log

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Merge a branch
git merge feature-name

# Pull latest changes
git pull
```

## Repository Settings Recommendations

### Protect Main Branch

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - ✓ Require a pull request before merging
   - ✓ Require status checks to pass

### Add Topics

Help others find your project:
1. Click the gear icon next to "About"
2. Add topics: `blackjack`, `statistics`, `education`, `react`, `game`

### Add Description and Website

1. Click the gear icon next to "About"
2. Description: `Educational blackjack app with statistical odds display for learning purposes`
3. Website: Your GitHub Pages URL (if deployed)

## Useful GitHub Features

### Issues
Track bugs and feature requests:
- Go to "Issues" tab
- Click "New issue"
- Add templates for bug reports and features

### Projects
Organize your work:
- Go to "Projects" tab
- Create a board to track development

### Releases
Create version releases:
- Go to "Releases" tab
- Click "Create a new release"
- Tag: `v1.0.0`
- Title: `Blackjack Statistics v1.0.0`
- Description: What's included

## Collaboration

### Invite Collaborators

1. Go to Settings → Collaborators
2. Click "Add people"
3. Enter their GitHub username

### Fork and Pull Request Workflow

For external contributors:
1. They fork your repository
2. Make changes in their fork
3. Submit a pull request
4. You review and merge

## Best Practices

### Commit Messages
- Use clear, descriptive messages
- Present tense ("Add feature" not "Added feature")
- Reference issues: "Fix #123: Resolve betting bug"

### .gitignore
Already configured to exclude:
- `node_modules/`
- `dist/`
- Environment files
- IDE configurations

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes

## GitHub Actions (CI/CD)

The `.github/workflows/deploy.yml` file automatically:
1. Runs on every push to `main`
2. Installs dependencies
3. Builds the app
4. Deploys to GitHub Pages

### View Build Status
- Go to "Actions" tab
- See all workflow runs
- Click on a run to see details

## Security

### Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update to latest versions
npx npm-check-updates -u
npm install
```

### GitHub Security Features
- Dependabot: Automatically creates PRs for security updates
- Code scanning: Enable in Security tab
- Secret scanning: Automatically enabled

## Next Steps

1. ✓ Create repository
2. ✓ Push code
3. ✓ Enable GitHub Pages (optional)
4. □ Add detailed documentation
5. □ Create issues for future features
6. □ Add screenshots to README
7. □ Set up automated testing
8. □ Prepare for mobile app deployment

## Resources

- [GitHub Docs](https://docs.github.com)
- [Git Book](https://git-scm.com/book/en/v2)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

Need help? Check the [GitHub Community Forum](https://github.community/) or create an issue in your repository.
