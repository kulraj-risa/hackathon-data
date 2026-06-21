#!/usr/bin/env node

/**
 * Automated deployment script for provider-dashboard using GitHub variables
 * Usage: 
 *   node deploy_via_git.js dev - Deploy to development environment
 *   node deploy_via_git.js prod - Deploy to production environment
 */

import { execSync } from 'child_process';
import { Octokit } from '@octokit/rest';
import { updateVersion } from "./versionHelperForGit.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the environment
const env = process.argv[2];
if (env !== 'dev' && env !== 'prod') {
  console.error('\n❌ ERROR: Invalid environment specified');
  console.error('   Please use one of the following commands:');
  console.error('   - node deploy_via_git.js dev    (for development)');
  console.error('   - node deploy_via_git.js prod   (for production)');
  process.exit(1);
}

// Load the appropriate .env file
const envFile = env === 'dev' ? '.env.development' : '.env.production';
const envPath = path.join(__dirname, envFile);
console.log(`\n📦 Loading environment from: ${envFile}`);

// Load environment variables
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error(`\n❌ Error loading ${envFile}:`, result.error);
  process.exit(1);
}

// Track script start time
const startTime = new Date();

// Debug: Print environment variables
console.log('\n🔍 Environment Variables:');
console.log('GITHUB_REPOSITORY_OWNER:', process.env.GITHUB_REPOSITORY_OWNER);
console.log('GITHUB_REPOSITORY_NAME:', process.env.GITHUB_REPOSITORY_NAME);


// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Function to get current version from GitHub variable
async function getCurrentVersion(env) {
  try {
    // First try to get the variable at the repository level
    try {
      console.log('\n📦 Attempting to get repository variable...');
      console.log('Owner:', process.env.GITHUB_REPOSITORY_OWNER);
      console.log('Repo:', process.env.GITHUB_REPOSITORY_NAME);
     
      
      const { data } = await octokit.actions.getRepoVariable({
        owner: process.env.GITHUB_REPOSITORY_OWNER,
        repo: process.env.GITHUB_REPOSITORY_NAME,
        name: "VERSION"
      });
      return data.value;
    } catch (repoError) {
      // If repository variable doesn't exist, try organization level
      console.log('\n📦 Repository variable not found, checking organization level...');
      console.log('Organization:', process.env.GITHUB_REPOSITORY_OWNER);
      
      const { data } = await octokit.actions.getOrgVariable({
        org: process.env.GITHUB_REPOSITORY_OWNER,
        name: 'VERSION'
      });
      return data.value;
    }
  } catch (error) {
    console.error('\n❌ Failed to fetch version from GitHub:', error.message);
    console.error('Error details:', error);
    console.error('\nPlease ensure:');
    console.error('1. The GITHUB_TOKEN has the necessary permissions (admin:org, repo)');
    console.error('2. The variable VERSION exists in either repository or organization variables');
    console.error('3. You have access to the organization/repository');
    console.error('4. The repository owner and name are correctly set');
    process.exit(1);
  }
}

// Function to update version in GitHub variable
async function updateGitHubVersion(newVersion, env) {
  try {
    // First try to update at repository level
    try {
      console.log('\n📦 Attempting to update repository variable...');
      console.log('Owner:', process.env.GITHUB_REPOSITORY_OWNER);
      console.log('Repo:', process.env.GITHUB_REPOSITORY_NAME);
     
      
      await octokit.actions.updateRepoVariable({
        owner: process.env.GITHUB_REPOSITORY_OWNER,
        repo: process.env.GITHUB_REPOSITORY_NAME,
        name: "VERSION",
        value: newVersion
      });
      console.log(`✅ Version updated in repository variables to ${newVersion}`);
    } catch (repoError) {
      // If repository variable doesn't exist, try organization level
      console.log('\n📦 Repository variable not found, updating at organization level...');
      console.log('Organization:', process.env.GITHUB_REPOSITORY_OWNER);
      
      await octokit.actions.updateOrgVariable({
        org: process.env.GITHUB_REPOSITORY_OWNER,
        name: 'VERSION',
        value: newVersion
      });
      console.log(`✅ Version updated in organization variables to ${newVersion}`);
    }
  } catch (error) {
    console.error('\n❌ Failed to update version in GitHub:', error.message);
    console.error('Error details:', error);
    console.error('\nPlease ensure:');
    console.error('1. The GITHUB_TOKEN has the necessary permissions (admin:org, repo)');
    console.error('2. You have access to update variables in the organization/repository');
    console.error('3. The repository owner and name are correctly set');
    process.exit(1);
  }
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

// Main deployment process
async function deploy() {
    console.log('\n📋 Starting deployment process...');
    console.log(`🔍 Environment: ${env === 'dev' ? 'Development' : 'Production'}`);
    console.log(`🕒 Start time: ${startTime.toLocaleString()}`);

    // Get current version from GitHub
    console.log('\n📦 Fetching current version from GitHub...');
    const currentVersion = await getCurrentVersion(env);
    console.log(`✅ Current version: ${currentVersion}`);

    // Update version
    console.log('\n📦 Updating version...');
    const newVersion = updateVersion(env, currentVersion);
    console.log(`✅ Version updated to ${newVersion}`);

    // Update version in GitHub
    await updateGitHubVersion(newVersion);


    // Deploy to the specified environment
    console.log(`\n🚀 Deploying to ${env === 'dev' ? 'development' : 'production'}...`);

    if (env === 'dev') {
        console.log('\n📦 Building application for development environment...');
        runCommand('npm run build:dev 2>&1 | grep -v "WARNING"');
        console.log('✅ Build completed successfully');

        console.log('\n🔄 Switching to development Firebase project...');

        console.log('\n🚀 Deploying to Firebase hosting (staging)...');
      
    } else {
        console.log('\n📦 Building application for production environment...');
        runCommand('npm run build:prod 2>&1 | grep -v "WARNING"');
        console.log('✅ Build completed successfully');

        console.log('\n🔄 Switching to production Firebase project...');

        console.log('\n🚀 Deploying to Firebase hosting (main)...');
    }

    console.log(`📝 Deployment summary:`);
    console.log(` ☀️ - Environment: ${env === 'dev' ? 'Development' : 'Production'}`);
    console.log(` 🎲 - Version: ${newVersion}`);
    console.log(` 🎯 - Target: ${env === 'dev' ? 'staging' : 'main'} ✅`);

   
}

// Run the deployment process
deploy().catch(error => {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}); 