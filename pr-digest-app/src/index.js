const { Probot } = require('probot');
const dotenv = require('dotenv');
const { createPRDigest } = require('./pr-digest');

// Load environment variables
dotenv.config();

/**
 * Main Probot application entry point
 * Handles GitHub webhook events for PR analysis
 */
module.exports = (app) => {
  console.log('PR Digest App loaded! 🚀');

  // Listen for pull request opened events
  app.on('pull_request.opened', async (context) => {
    console.log('PR opened event received:', {
      repo: context.payload.repository.full_name,
      pr: context.payload.pull_request.number,
      title: context.payload.pull_request.title
    });

    try {
      await createPRDigest(context);
    } catch (error) {
      console.error('Error processing PR opened event:', error);
    }
  });

  // Listen for pull request synchronize events (new commits pushed)
  app.on('pull_request.synchronize', async (context) => {
    console.log('PR synchronize event received:', {
      repo: context.payload.repository.full_name,
      pr: context.payload.pull_request.number,
      title: context.payload.pull_request.title
    });

    try {
      await createPRDigest(context);
    } catch (error) {
      console.error('Error processing PR synchronize event:', error);
    }
  });

  // Health check endpoint for monitoring
  app.on('ping', async (context) => {
    console.log('Ping received from GitHub');
  });
};

// For running standalone
if (require.main === module) {
  const probot = new Probot();
  probot.load(module.exports);
  probot.start();
}