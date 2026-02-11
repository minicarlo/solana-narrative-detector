# Solana Narrative Detector

⚡ Real-time detection of emerging narratives in the Solana ecosystem

[![Deploy to GitHub Pages](https://github.com/openclaw-agent/solana-narrative-detector/actions/workflows/deploy.yml/badge.svg)](https://github.com/openclaw-agent/solana-narrative-detector/actions/workflows/deploy.yml)
[![Daily Update](https://github.com/openclaw-agent/solana-narrative-detector/actions/workflows/daily-update.yml/badge.svg)](https://github.com/openclaw-agent/solana-narrative-detector/actions/workflows/daily-update.yml)

## Overview

This tool monitors multiple data sources to detect and track emerging narratives in the Solana ecosystem. It aggregates on-chain data, GitHub activity, and social signals to identify trending topics and generate project ideas.

**Live Dashboard:** https://openclaw-agent.github.io/solana-narrative-detector/

## Features

- 🔍 **Multi-source data collection**
  - Helius (on-chain data)
  - GitHub (repository activity)
  - X/Twitter (social signals from KOLs)

- 📊 **6 Narrative Categories**
  - DeFi Innovation
  - Gaming & NFT
  - Infrastructure
  - AI x Crypto
  - Social & Consumer
  - Developer Tools

- 🎯 **Confidence Scoring**
  - Algorithmic detection based on signal strength
  - Weighted by source reliability
  - Real-time updates

- 💡 **Project Idea Generation**
  - AI-powered suggestions for each narrative
  - Practical, buildable concepts

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Helius API key

### Installation

```bash
# Clone the repository
git clone https://github.com/openclaw-agent/solana-narrative-detector.git
cd solana-narrative-detector

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your HELIUS_API_KEY

# Build the project
npm run build

# Run detection pipeline
npm run detect
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HELIUS_API_KEY` | Your Helius API key | Yes |

## Usage

### Running Detection

```bash
# Run the full detection pipeline
npm run detect

# Run in development mode (TypeScript directly)
npm run dev
```

### Viewing Results

After running detection, view the dashboard:

```bash
# Open the dashboard
open dashboard/index.html

# Or serve with a local server
cd dashboard && python3 -m http.server 8080
```

## Architecture

```
┌─────────────────┐
│   Data Sources  │
├─────────────────┤
│  • Helius RPC   │
│  • GitHub API   │
│  • X/Twitter    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Collectors     │
│  (src/collectors)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Analyzer       │
│  (src/analyzer) │
│  • Signal extraction
│  • Confidence calc
│  • Narrative detection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard      │
│  (dashboard/)   │
│  • HTML/CSS/JS  │
│  • GitHub Pages │
└─────────────────┘
```

## Data Structure

### Narrative Object

```typescript
{
  id: string;
  name: string;
  description: string;
  confidence: number; // 0-1
  trendingKeywords: string[];
  topProjects: Project[];
  projectIdeas: string[];
  dataSources: {
    helius: number;
    github: number;
    social: number;
  };
  lastUpdated: string;
}
```

## Deployment

The project uses GitHub Actions for automated deployment:

1. **On every push to main:**
   - TypeScript compilation
   - Detection pipeline run
   - Dashboard deployment to GitHub Pages

2. **Daily at 08:00 UTC:**
   - Automated data refresh
   - Commit updated narratives.json
   - Trigger redeployment

### Manual Deployment

To deploy manually:

```bash
# Ensure you have the latest code
git pull origin main

# Run detection
npm run detect

# Commit updated data
git add data/narratives.json
git commit -m "chore: Update narrative data"
git push origin main
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Built for [Superteam Earn](https://earn.superteam.fun) bounty
- Powered by [Helius](https://helius.xyz) for Solana data
- Thanks to the Solana developer community

---

Built with ⚡ by OpenClaw Agent
