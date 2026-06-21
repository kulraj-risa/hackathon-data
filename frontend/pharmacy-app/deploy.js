#!/usr/bin/env node

/**
 * Automated deployment script for provider-dashboard
 * Usage: 
 *   node deploy.js dev - Deploy to development environment
 *   node deploy.js prod - Deploy to production environment
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { updateVersion } from "./versionHelper.js";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the environment from command line argument


// Track script start time
const startTime = new Date();

// Get the environment from command line argument
const env = process.argv[2];

// Validate environment argument
if (env !== 'dev' && env !== 'prod') {
  console.error('\n❌ ERROR: Invalid environment specified');
  console.error('   Please use one of the following commands:');
  console.error('   - node deploy.js dev    (for development)');
  console.error('   - node deploy.js prod   (for production)');
  process.exit(1);
}

// Function to run commands and display output
const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}`);
    console.error('   Error details:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Deployment was not completed. Please fix the error and try again.');
    process.exit(1);
  }
};

// Calculate elapsed time
const getElapsedTime = () => {
  const endTime = new Date();
  const elapsed = Math.round((endTime - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}m ${seconds}s`;
};

console.log('\n📋 Starting deployment process...');
console.log(`🔍 Environment: ${env === 'dev' ? 'Development' : 'Production'}`);
console.log(`🕒 Start time: ${startTime.toLocaleString()}`);

// Update version
console.log('\n📦 Updating version...');
const newVersion = updateVersion(env);
console.log(`✅ Version updated to ${newVersion}`);

// Clean dependencies
console.log('\n🧹 Cleaning dependencies...');
console.log('   - Removing package-lock.json');
console.log('   - Removing node_modules directory');
runCommand('rm -f package-lock.json && rm -rf node_modules');
console.log('✅ Cleanup completed successfully');

// Install dependencies
console.log('\n📦 Installing fresh dependencies...');
console.log('   - This may take a few minutes...');
runCommand('npm install');
console.log('✅ Dependencies installed successfully');

// Deploy to the specified environment
console.log(`\n🚀 Deploying to ${env === 'dev' ? 'development' : 'production'}...`);

if (env === 'dev') {
  console.log('\n📦 Building application for development environment...');
  runCommand('npm run build:dev');
  console.log('✅ Build completed successfully');

  console.log('\n🔄 Switching to development Firebase project...');
  runCommand('firebase use dev');
  console.log('✅ Firebase project switched to dev');

  console.log('\n🚀 Deploying to Firebase hosting (staging)...');
  runCommand('firebase deploy --only hosting:staging');
  console.log('✅ Firebase deployment completed');
} else {
  console.log('\n📦 Building application for production environment...');
  runCommand('npm run build:prod');
  console.log('✅ Build completed successfully');

  console.log('\n🔄 Switching to production Firebase project...');
  runCommand('firebase use prod');
  console.log('✅ Firebase project switched to prod');

  console.log('\n🚀 Deploying to Firebase hosting (main)...');
  runCommand('firebase deploy --only hosting:main');
  console.log('✅ Firebase deployment completed');
}

console.log(`\n🎉 Deployment to ${env === 'dev' ? 'development' : 'production'} completed successfully!`);
console.log(`📝 Deployment summary:`);
console.log(`   - Environment: ${env === 'dev' ? 'Development' : 'Production'}`);
console.log(`   - Version: ${newVersion}`);
console.log(`   - Target: ${env === 'dev' ? 'staging' : 'main'}`);
console.log(`   - Start time: ${startTime.toLocaleString()}`);
console.log(`   - End time: ${new Date().toLocaleString()}`);
console.log(`   - Total time: ${getElapsedTime()}`);
console.log(`\n✨ Your application is now live! ✨`); 