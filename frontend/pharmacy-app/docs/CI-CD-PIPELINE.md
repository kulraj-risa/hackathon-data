# CI/CD Pipeline Documentation

## 📋 **Pipeline Overview**

This project uses GitHub Actions for automated CI/CD deployment to Firebase hosting with two environments:

| Environment    | Branch | Target URL                         | Firebase Project  | Status     |
| -------------- | ------ | ---------------------------------- | ----------------- | ---------- |
| **Production** | `main` | https://pharmacy-dash-demo.web.app | `rapids-platform` | ✅ Working |

## 🚀 **CI/CD Workflows**

### Staging Deployment

- **Trigger**: Push to `dev` branch
- **Workflow**: `.github/workflows/development.yml`
- **Target**: `hosting:staging` → `pharmacy-dash-demo.web.app`
- **API**: `https://api-dev.risalabs.ai`

### Production Deployment

- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/main.yml`
- **Target**: `hosting:main` → `pharmacy-dash-demo.web.app`
- **API**: `https://api.risalabs.ai`

## 📁 **Workflow Files**

### Development Workflow (`.github/workflows/development.yml`)

```yaml
name: Deploy to Development
on:
  push:
    branches: [dev]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node deployWorkflow.js dev
        env:
          FIREBASE_TOKEN_DEV: ${{ secrets.FIREBASE_TOKEN_DEV }}
```

### Production Workflow (`.github/workflows/main.yml`)

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node deployWorkflow.js prod
        env:
          FIREBASE_TOKEN_PROD: ${{ secrets.FIREBASE_TOKEN_PROD }}
```

## 🔧 **Deployment Scripts**

### `deployWorkflow.js`

- Main orchestrator script
- Handles environment setup
- Calls `deployViaGit.js` with appropriate environment

### `deployViaGit.js`

- Executes the actual deployment
- Builds the app for specified environment
- Deploys to Firebase hosting

## 🎯 **Deployment Process**

### To Deploy to Staging:

```bash
git add .
git commit -m "Your changes"
git push origin dev
```

### To Deploy to Production:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## 🔐 **Required Secrets**

The following secrets must be configured in GitHub repository settings:

| Secret                | Purpose                                  | Environment |
| --------------------- | ---------------------------------------- | ----------- |
| `FIREBASE_TOKEN_DEV`  | Firebase authentication for dev project  | Development |
| `FIREBASE_TOKEN_PROD` | Firebase authentication for prod project | Production  |

## 📊 **Build Process**

### Development Build (`dev` branch):

1. `npm install` - Install dependencies
2. `npm run build:dev` - Build with development environment
3. `firebase use dev` - Switch to dev project
4. `firebase deploy --only hosting:staging` - Deploy to staging

### Production Build (`main` branch):

1. `npm install` - Install dependencies
2. `npm run build:prod` - Build with production environment
3. `firebase use prod` - Switch to prod project
4. `firebase deploy --only hosting:main` - Deploy to production

## ✅ **Recent Improvements**

1. **Fixed CSP Issues**: Added `https://api-dev.risalabs.ai` to Content Security Policy
2. **Completed Scripts**: Fixed incomplete `deployViaGit.js` with actual Firebase commands
3. **Streamlined Workflows**: Removed redundant Firebase CLI calls
4. **Environment Consistency**: Both dev and prod use identical deployment flow

## 🛠️ **Troubleshooting**

### Deployment Fails

1. Check GitHub Actions logs
2. Verify Firebase tokens are valid
3. Ensure proper branch naming (`dev` for staging, `main` for production)

### API Calls Not Working

1. Verify CSP configuration in `firebase.json`
2. Check API endpoints match environment
3. Clear browser cache after deployment

### Build Warnings

- ESLint warnings are expected and don't block deployment
- Bundle size warnings can be addressed with code optimization

## 📈 **Monitoring**

- **Firebase Console**: Monitor deployment status and hosting metrics
- **GitHub Actions**: View build logs and deployment history
- **Browser DevTools**: Verify API calls and CSP compliance

## 🔄 **Future Enhancements**

1. Add automated testing before deployment
2. Implement rollback mechanisms
3. Add performance monitoring
4. Set up deployment notifications
