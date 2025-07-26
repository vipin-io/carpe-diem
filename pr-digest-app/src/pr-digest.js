const OpenAI = require('openai');

// Initialize OpenAI client (with fallback for testing)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Main function to create and post PR digest
 * This orchestrates all four phases of our analysis
 */
async function createPRDigest(context) {
  const { owner, repo } = context.repo();
  const prNumber = context.payload.pull_request.number;
  
  console.log(`Creating digest for PR #${prNumber} in ${owner}/${repo}`);

  try {
    // Phase 1: Already handled (webhook setup) ✅
    console.log('✅ Phase 1: Webhook received');

    // Phase 2: Fetch PR diff and parse hunks
    console.log('🔄 Phase 2: Fetching PR diff...');
    const diffData = await fetchPRDiff(context);
    
    // Phase 3: Analyze with LLM
    console.log('🔄 Phase 3: Analyzing with LLM...');
    const analysis = await analyzePRWithLLM(diffData);
    
    // Phase 4: Post back to GitHub as Check Run
    console.log('🔄 Phase 4: Creating Check Run...');
    await createCheckRun(context, analysis);
    
    console.log(`✅ PR digest completed for #${prNumber}`);
    
  } catch (error) {
    console.error(`❌ Failed to create digest for PR #${prNumber}:`, error);
    
    // Create a failed check run
    await createFailedCheckRun(context, error.message);
  }
}

/**
 * Phase 2: Fetch PR diff via GitHub API and parse into hunks
 */
async function fetchPRDiff(context) {
  const { owner, repo } = context.repo();
  const prNumber = context.payload.pull_request.number;
  
  // TODO: Implement in Phase 2
  // For now, return mock data
  console.log('📝 Fetching diff data (Phase 2 - TODO)');
  
  return {
    files: [],
    hunks: [],
    stats: {
      additions: 0,
      deletions: 0,
      changed_files: 0
    }
  };
}

/**
 * Phase 3: Analyze PR diff with LLM to get classification, summaries, and checklist
 */
async function analyzePRWithLLM(diffData) {
  // Check if OpenAI is available
  if (!openai) {
    console.log('🤖 OpenAI not configured, using mock analysis (Phase 3 - TODO)');
    
    return {
      classification: 'feature',
      summaries: [
        'Added new user authentication system',
        'Implemented JWT token handling',
        'Updated API endpoints for security'
      ],
      checklist: [
        'Verify JWT token expiration handling',
        'Test authentication edge cases',
        'Review security implications of new endpoints',
        'Check for proper error handling',
        'Ensure backward compatibility'
      ]
    };
  }
  
  // TODO: Implement actual LLM analysis in Phase 3
  console.log('🤖 Analyzing with LLM (Phase 3 - TODO)');
  
  return {
    classification: 'feature',
    summaries: [
      'Added new user authentication system',
      'Implemented JWT token handling',
      'Updated API endpoints for security'
    ],
    checklist: [
      'Verify JWT token expiration handling',
      'Test authentication edge cases',
      'Review security implications of new endpoints',
      'Check for proper error handling',
      'Ensure backward compatibility'
    ]
  };
}

/**
 * Phase 4: Create GitHub Check Run with the analysis results
 */
async function createCheckRun(context, analysis) {
  const { owner, repo } = context.repo();
  const headSha = context.payload.pull_request.head.sha;
  
  const checkRunParams = {
    owner,
    repo,
    name: 'PR Digest & Review Guide',
    head_sha: headSha,
    status: 'completed',
    conclusion: 'neutral', // neutral = informational
    output: {
      title: `📋 PR Analysis: ${analysis.classification.toUpperCase()}`,
      summary: formatCheckRunSummary(analysis),
      text: formatCheckRunDetails(analysis)
    }
  };
  
  try {
    const result = await context.octokit.checks.create(checkRunParams);
    console.log(`✅ Check run created: ${result.data.html_url}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to create check run:', error);
    throw error;
  }
}

/**
 * Create a failed check run when analysis fails
 */
async function createFailedCheckRun(context, errorMessage) {
  const { owner, repo } = context.repo();
  const headSha = context.payload.pull_request.head.sha;
  
  const checkRunParams = {
    owner,
    repo,
    name: 'PR Digest & Review Guide',
    head_sha: headSha,
    status: 'completed',
    conclusion: 'action_required',
    output: {
      title: '❌ PR Analysis Failed',
      summary: 'Unable to analyze this pull request automatically.',
      text: `**Error:** ${errorMessage}\n\nPlease review this PR manually or check the app configuration.`
    }
  };
  
  try {
    await context.octokit.checks.create(checkRunParams);
  } catch (error) {
    console.error('❌ Failed to create failed check run:', error);
  }
}

/**
 * Format the check run summary (shown in PR checks list)
 */
function formatCheckRunSummary(analysis) {
  return `**Type:** ${analysis.classification.toUpperCase()} | **Changes:** ${analysis.summaries.length} key areas | **Review Items:** ${analysis.checklist.length}`;
}

/**
 * Format the detailed check run output
 */
function formatCheckRunDetails(analysis) {
  const sections = [
    '## 🏷️ Classification',
    `**${analysis.classification.toUpperCase()}**`,
    '',
    '## 📝 Key Changes',
    ...analysis.summaries.map((summary, index) => `${index + 1}. ${summary}`),
    '',
    '## ✅ Review Checklist',
    ...analysis.checklist.map(item => `- [ ] ${item}`),
    '',
    '---',
    '*This analysis was generated automatically. Please use it as a starting point for your review.*'
  ];
  
  return sections.join('\n');
}

module.exports = {
  createPRDigest
};