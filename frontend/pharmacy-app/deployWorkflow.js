#!/usr/bin/env node

/**
 * Workflow script for deployment that handles cleanup and installation
 * Usage: 
 *   node deployWorkflow.js dev - Deploy to development environment
 *   node deployWorkflow.js prod - Deploy to production environment
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the environment from command line argument
const env = process.argv[2];

// Validate environment argument
if (env !== 'dev' && env !== 'prod') {
  console.error('\n❌ ERROR: Invalid environment specified');
  console.error('   Please use one of the following commands:');
  console.error('   - node deployWorkflow.js dev    (for development)');
  console.error('   - node deployWorkflow.js prod   (for production)');
  process.exit(1);
}

// Function to run commands and display output
const runCommand = (command, env = {}) => {
  try {
    // For npm commands, suppress warnings by redirecting stderr to /dev/null
    const finalCommand = command.startsWith('npm') 
      ? `${command} 2>/dev/null`
      : command;

    execSync(finalCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env
      }
    });
  } catch (error) {
    console.error(`\n❌ Command failed: ${command}`);
    console.error('   Error details:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Workflow was not completed. Please fix the error and try again.');
    process.exit(1);
  }
};

// Main workflow process
async function runWorkflow() {
    console.log('\n📋 Starting deployment workflow...');
    console.log(`🔍 Environment: ${env === 'dev' ? 'Development' : 'Production'}`);
    console.log(`🕒 Start time: ${new Date().toLocaleString()}`);

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

    // Install Firebase CLI globally
    console.log('\n🔥 Installing Firebase CLI...');
    runCommand('npm install -g firebase-tools');
    console.log('✅ Firebase CLI installed successfully');

    // Run the deployment script with CI=false to ignore warnings
    console.log('\n🚀 Starting deployment process...');
    runCommand(`node --no-warnings deployViaGit.js ${env}`, {
      CI: 'false',
      NODE_OPTIONS: '--no-warnings'
    });
}

// Run the workflow
runWorkflow().catch(error => {
  console.error('\n❌ Workflow failed:', error.message);
  process.exit(1);
}); 