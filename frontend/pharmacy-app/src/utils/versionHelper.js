const fs = require('fs');
const path = require('path');

function updateVersion(env) {
  // Get the root directory using process.cwd()
  const rootDir = process.cwd();
  
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  const newVersion = env === 'dev' 
    ? `${major}.${minor}.${patch + 1}`
    : `${major}.${minor + 1}.0`;
  
  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  // Update the appropriate environment file
  const envFileName = env === 'dev' ? '.env.development' : '.env.production';
  const envPath = path.join(rootDir, envFileName);
  
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

module.exports = { updateVersion }; 