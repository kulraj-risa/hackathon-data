import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateVersion(env) {
  // Get the root directory (same directory as this script)
  const rootDir = __dirname;
  console.log('Root directory:', rootDir);
  
  const packageJsonPath = path.join(rootDir, 'package.json');
  console.log('Package.json path:', packageJsonPath);
  
  // Read and update package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('Current version:', packageJson.version);
    
    const currentVersion = packageJson.version;
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    const newVersion = env === 'dev' 
      ? `${major}.${minor}.${patch + 1}`
      : `${major}.${minor + 1}.0`;
    
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('Updated package.json with version:', newVersion);
    
    // Update the appropriate environment file
    const envFileName = env === 'dev' ? '.env.development' : '.env.production';
    const envPath = path.join(rootDir, envFileName);
    console.log('Environment file path:', envPath);
    
    // Read existing env file content
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('Current env file content:', envContent);
    } catch (error) {
      console.log('No existing env file found, creating new one');
      envContent = '';
    }
    
    // Split content into lines and remove empty lines
    const lines = envContent.split('\n').filter(line => line.trim());
    
    // Check if REACT_APP_VERSION exists
    const versionIndex = lines.findIndex(line => line.startsWith('REACT_APP_VERSION='));
    
    if (versionIndex !== -1) {
      // Replace existing version
      lines[versionIndex] = `REACT_APP_VERSION=${newVersion}`;
    } else {
      // Add new version line
      lines.push(`REACT_APP_VERSION=${newVersion}`);
    }
    
    // Join lines with newlines and ensure proper line endings
    const newContent = lines.join('\n') + '\n';
    
    // Write back to the environment file
    fs.writeFileSync(envPath, newContent);
    console.log('Updated env file content:', newContent);
    
    // Verify the file was written
    const verifyContent = fs.readFileSync(envPath, 'utf8');
    console.log('Verified env file content:', verifyContent);
    
    // Double-check if the version was actually written
    const finalContent = fs.readFileSync(envPath, 'utf8');
    if (!finalContent.includes(`REACT_APP_VERSION=${newVersion}`)) {
      throw new Error('Failed to write version to env file');
    }
    
    console.log(`📦 Version updated to ${newVersion} in ${envFileName}`);
    return newVersion;
  } catch (error) {
    console.error('Error updating version:', error);
    throw error;
  }
}

export { updateVersion }; 