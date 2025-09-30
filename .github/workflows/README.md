# ⚙️ GitHub Actions Workflows - CI/CD Pipeline

**Location:** `/.github/workflows/` directory

This directory contains all CI/CD workflows for the IntegriTest System.

---

## 📂 Workflow Files

\`\`\`
.github/workflows/
├── README.md              # This file - CI/CD guide
├── ci.yml                 # Main CI/CD pipeline
├── test-coverage.yml      # Test coverage reporting
├── pr-checks.yml          # Pull request validation
└── deploy.yml             # Production deployment
\`\`\`

---

## 🔄 Workflows Overview

### 1. **Main CI/CD Pipeline** (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- 🧪 **Test**: Runs unit tests on Node.js 18.x and 20.x
- 🏗️ **Build**: Builds the Next.js application
- 🔒 **Security**: Runs npm audit for vulnerabilities

**Features:**
- Matrix testing across multiple Node versions
- Coverage report upload to Codecov
- Build artifact preservation
- Automated security scanning

---

### 2. **Test Coverage Report** (`test-coverage.yml`)
**Triggers:** Push to main, Pull Requests

**Jobs:**
- 📊 **Coverage**: Generates detailed coverage reports

**Features:**
- Coverage badge generation
- PR comments with coverage details
- Codecov integration
- Coverage threshold enforcement (70%)
- HTML coverage reports

---

### 3. **Deploy to Production** (`deploy.yml`)
**Triggers:** Push to main, Manual workflow dispatch

**Jobs:**
- 🧪 **Test and Build**: Runs tests and builds application
- 🚀 **Deploy**: Deploys to Vercel production

**Features:**
- Automated deployment on main branch merge
- Manual deployment trigger option
- Deployment status comments on commits
- Rollback capability

---

### 4. **Pull Request Checks** (`pr-checks.yml`)
**Triggers:** Pull Request events (open, synchronize, reopened)

**Jobs:**
- 🔍 **Lint**: ESLint code quality checks
- 📝 **Type Check**: TypeScript type validation
- 🧪 **Test**: Unit test execution
- 🏗️ **Build Check**: Ensures application builds successfully
- 📦 **Size Check**: Bundle size analysis

**Features:**
- Comprehensive PR validation
- Test result artifacts
- Bundle size tracking
- Code quality enforcement

---

## 🔐 Required Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions**

\`\`\`
VERCEL_TOKEN          # Vercel deployment token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
CODECOV_TOKEN         # Codecov upload token (optional)
\`\`\`

### How to Get Secrets:

**Vercel Secrets:**
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Copy `VERCEL_TOKEN`
4. Get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from project settings

**Codecov Token:**
1. Sign up at https://codecov.io
2. Add your repository
3. Copy the upload token

---

## 🛠️ Setup Instructions

### 1. Enable GitHub Actions
- Go to repository **Settings → Actions → General**
- Enable "Allow all actions and reusable workflows"

### 2. Add Secrets
- Go to **Settings → Secrets and variables → Actions**
- Click "New repository secret"
- Add each required secret

### 3. Configure Branch Protection
- Go to **Settings → Branches**
- Add rule for `main` branch
- Enable: "Require status checks to pass before merging"
- Select required checks: `test`, `build`, `lint`

### 4. Codecov Integration (Optional)
- Sign up at https://codecov.io
- Add repository
- Copy token to GitHub secrets as `CODECOV_TOKEN`

---

## 🧪 Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

\`\`\`bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act push

# Run PR checks
act pull_request

# Run specific job
act -j test

# List all workflows
act -l
\`\`\`

---

## 📛 Workflow Status Badges

Add these badges to your `README.md`:

\`\`\`markdown
![CI/CD](https://github.com/USERNAME/REPO/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg)
![Tests](https://github.com/USERNAME/REPO/workflows/Pull%20Request%20Checks/badge.svg)
\`\`\`

Replace `USERNAME` and `REPO` with your GitHub username and repository name.

---

## 🐛 Troubleshooting

### Tests Failing in CI but Passing Locally
- ✅ Check Node.js version matches (18.x or 20.x)
- ✅ Ensure all dependencies are in `package.json`
- ✅ Review environment variables
- ✅ Check for timezone or locale differences

### Build Failures
- ✅ Clear cache: Delete `.next` and `node_modules`
- ✅ Check for TypeScript errors: `npm run type-check`
- ✅ Verify all imports are correct
- ✅ Check for missing dependencies

### Deployment Issues
- ✅ Verify Vercel secrets are correct
- ✅ Check Vercel project settings
- ✅ Review deployment logs in Vercel dashboard
- ✅ Ensure build command is correct

### Coverage Upload Failures
- ✅ Verify `CODECOV_TOKEN` is set correctly
- ✅ Check coverage files are generated
- ✅ Review Codecov dashboard for errors

---

## 📚 Additional Resources

- **Unit Tests Guide:** `/tests/README.md`
- **Testing Documentation:** `/docs/TESTING.md`
- **Coverage Reports:** `/docs/COVERAGE_REPORT.md`
- **Project Structure:** `/PROJECT_STRUCTURE.md`

---

## 🔄 Workflow Execution Order

**On Pull Request:**
1. `pr-checks.yml` runs (lint, type-check, test, build)
2. `test-coverage.yml` runs (coverage report)
3. Results posted as PR comments

**On Push to Main:**
1. `ci.yml` runs (test, build, security)
2. `test-coverage.yml` runs (coverage report)
3. `deploy.yml` runs (deploy to production)

---

**Last Updated:** 2025  
**Maintained by:** IntegriTest Development Team
