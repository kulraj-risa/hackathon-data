#!/usr/bin/env node

/**
 * Automated deployment script for pharmacy-dashboard DEMO environment
 * Usage: node deploy-demo.js
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Track script start time
const startTime = new Date();

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

console.log('\n📋 Starting DEMO deployment process...');
console.log(`🔍 Environment: Demo (Open for all @risalabs.ai users)`);
console.log(`🕒 Start time: ${startTime.toLocaleString()}`);

// Build for demo
console.log('\n📦 Building application for DEMO environment...');
console.log('   - Using .env.demo configuration');
console.log('   - Enabling access for all @risalabs.ai emails');
runCommand('npm run build:demo');
console.log('✅ Build completed successfully');

// Switch to demo Firebase project
console.log('\n🔄 Switching to Firebase demo project...');
runCommand('firebase use demo');
console.log('✅ Firebase project switched to demo (rapids-platform)');

// Deploy to demo hosting
console.log('\n🚀 Deploying to Firebase hosting (pharmacy-dash-demo)...');
runCommand('firebase deploy --only hosting:demo');
console.log('✅ Firebase deployment completed');

console.log(`\n🎉 Demo deployment completed successfully!`);
console.log(`📝 Deployment summary:`);
console.log(`   - Environment: Demo`);
console.log(`   - Access: Open to all @risalabs.ai emails`);
console.log(`   - Target: pharmacy-dash-demo`);
console.log(`   - URL: https://pharmacy-dash-demo.web.app`);
console.log(`   - Start time: ${startTime.toLocaleString()}`);
console.log(`   - End time: ${new Date().toLocaleString()}`);
console.log(`   - Total time: ${getElapsedTime()}`);
console.log(`\n✨ Your demo is now live! ✨`);
console.log(`\n👥 All users with @risalabs.ai email can now sign in!`);
