# PR Digest & Decision Support

A GitHub App that automatically analyzes pull requests using AI to provide intelligent summaries, classifications, and review checklists.

## 🎯 Features

- **Automatic PR Classification**: Categorizes PRs as bugfix, feature, refactor, security hardening, etc.
- **Smart Change Summaries**: Extracts and condenses the top 3 change blocks into one-sentence summaries
- **Review Checklists**: Generates 3-5 actionable review items highlighting risk areas, edge cases, and testing needs
- **GitHub Check Runs**: Posts analysis directly to PR status checks for easy visibility
- **Real-time Updates**: Analyzes PRs on open and when new commits are pushed

## 🏗️ Architecture

Built in 4 phases:
1. **Webhook Listener**: Probot app responding to `pull_request.opened` and `synchronize` events
2. **Diff Analysis**: Fetch PR diffs via GitHub API and parse into meaningful chunks
3. **AI Analysis**: OpenAI GPT-4 Turbo processes diffs to generate insights
4. **Results Delivery**: Post formatted analysis back as GitHub Check Runs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- GitHub App credentials
- OpenAI API key

### Local Development

1. **Clone and install**:
   ```bash
   git clone <your-repo>
   cd pr-digest-app
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Create GitHub App**:
   - Go to https://github.com/settings/apps/new
   - Use the `app.yml` manifest or create manually with these permissions:
     - Pull requests: Read
     - Contents: Read  
     - Checks: Write
     - Metadata: Read
   - Subscribe to: `pull_request`, `ping` events

4. **Run locally**:
   ```bash
   npm run dev
   ```

5. **Expose webhook** (for testing):
   ```bash
   # Install and use ngrok or similar
   npx smee-client --url https://smee.io/your-channel --path /webhooks/github --port 3000
   ```

### Production Deployment (Vercel)

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard:
   - `GITHUB_APP_ID`
   - `GITHUB_PRIVATE_KEY`
   - `GITHUB_WEBHOOK_SECRET`
   - `OPENAI_API_KEY`

3. **Update GitHub App webhook URL** to your Vercel deployment URL + `/webhooks/github`

## 📁 Project Structure

```
pr-digest-app/
├── src/
│   ├── index.js          # Main Probot app entry point
│   └── pr-digest.js      # Core PR analysis logic
├── package.json          # Dependencies and scripts
├── app.yml              # GitHub App manifest
├── vercel.json          # Vercel deployment config
├── .env.example         # Environment template
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_APP_ID` | Your GitHub App ID | ✅ |
| `GITHUB_PRIVATE_KEY` | GitHub App private key (PEM format) | ✅ |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret for security | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 Turbo | ✅ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `PORT` | Local development port | ❌ |

### Classification Types

Currently supports these PR classifications:
- `feature` - New functionality
- `bugfix` - Bug fixes
- `refactor` - Code restructuring
- `security` - Security improvements
- `performance` - Performance optimizations
- `documentation` - Documentation updates
- `dependencies` - Dependency updates
- `ci/cd` - Build/deployment changes

## 🧪 Development Status

- ✅ **Phase 1**: Webhook scaffolding complete
- 🔄 **Phase 2**: PR diff fetching (next)
- ⏳ **Phase 3**: LLM analysis integration
- ⏳ **Phase 4**: Check run formatting

## 📋 Example Output

When installed, the app creates check runs like this:

```
📋 PR Analysis: FEATURE

Type: FEATURE | Changes: 3 key areas | Review Items: 5

## 🏷️ Classification
**FEATURE**

## 📝 Key Changes
1. Added new user authentication system
2. Implemented JWT token handling  
3. Updated API endpoints for security

## ✅ Review Checklist
- [ ] Verify JWT token expiration handling
- [ ] Test authentication edge cases
- [ ] Review security implications of new endpoints
- [ ] Check for proper error handling
- [ ] Ensure backward compatibility
```

## 🤝 Contributing

This is an educational project demonstrating GitHub App development with AI integration. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests

## 📄 License

MIT - see LICENSE file for details