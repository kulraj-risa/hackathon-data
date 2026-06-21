import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateVersion(env, version) {
  if (!version) {
    throw new Error('Version is required');
  }

  if (env !== 'dev' && env !== 'prod') {
    throw new Error('Environment must be either "dev" or "prod"');
  }

  // Validate version format (x.y.z)
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    throw new Error('Version must be in format x.y.z (e.g., 1.2.3)');
  }

  // Split version into components
  const [major, minor, patch] = version.split('.').map(Number);
  
  let newVersion;
  if (env === 'dev') {
    // For dev, increment patch version
    newVersion = `${major}.${minor}.${patch + 1}`;
  } else {
    // For prod, increment minor version and reset patch to 0
    newVersion = `${major}.${minor + 1}.0`;
  }

  // Update package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  // Update the appropriate environment file
  const envFileName = env === 'dev' ? '.env.development' : '.env.production';
  const envPath = path.join(__dirname, envFileName);
  
  // Read existing env file content
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    // If file doesn't exist, start with empty content
    envContent = '';
  }
  
  // Update or add REACT_APP_VERSION
  const versionLine = `REACT_APP_VERSION=${newVersion}`;
  if (envContent.includes('REACT_APP_VERSION=')) {
    // Replace existing version
    envContent = envContent.replace(/REACT_APP_VERSION=.*\n?/, `${versionLine}\n`);
  } else {
    // Add new version line
    envContent = `${envContent}${versionLine}\n`;
  }
  
  // Write back to the environment file
  fs.writeFileSync(envPath, envContent);
  
  console.log(`📦 Version updated to ${newVersion} in ${envFileName}`);
  return newVersion;
}

export { updateVersion }; 