/**
 * Solana Narrative Detector - Main Entry Point
 * Orchestrates all data collectors and runs the analysis pipeline
 * Scheduled to run every 15 minutes using node-cron
 */

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { NarrativeDetector } from './analyzer/narrative-detector.js';
import { GitHubCollector } from './collectors/github-collector.js';
import { SocialCollector } from './collectors/social-collector.js';
import { HeliusCollector } from './collectors/helius-collector.js';

// Ensure required directories exist
const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data');

function ensureDirectories() {
  [DATA_DIR, PUBLIC_DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Run the full detection pipeline
 */
async function runDetection() {
  const startTime = Date.now();
  console.log(`\n🔍 Starting detection pipeline at ${new Date().toISOString()}`);
  console.log('=' .repeat(60));

  try {
    // Initialize detector
    const detector = new NarrativeDetector();

    // Run detection
    const data = await detector.detectNarratives();

    // Prepare output data
    const outputData = {
      timestamp: data.timestamp,
      totalNarratives: data.narratives.length,
      trending: calculateTrendDirection(data.narratives),
      narratives: data.narratives.sort((a, b) => b.confidence - a.confidence),
    };

    // Save to data directory (for GitHub Actions)
    const dataPath = path.join(DATA_DIR, 'narratives.json');
    fs.writeFileSync(dataPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved to: ${dataPath}`);

    // Save to public directory (for GitHub Pages)
    const publicPath = path.join(PUBLIC_DATA_DIR, 'narratives.json');
    fs.writeFileSync(publicPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved to: ${publicPath}`);

    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Detection complete in ${duration}s`);
    console.log(`📊 Detected ${data.narratives.length} narratives`);
    console.log('\n📈 Narrative Summary:');
    console.log('-'.repeat(60));

    for (const narrative of data.narratives) {
      const confidence = Math.round(narrative.confidence * 100);
      const bar = '█'.repeat(Math.floor(confidence / 10)) + '░'.repeat(10 - Math.floor(confidence / 10));
      const sources = `[H:${narrative.dataSources.helius} G:${narrative.dataSources.github} S:${narrative.dataSources.social}]`;
      console.log(`${bar} ${confidence.toString().padStart(3)}% - ${narrative.name.padEnd(20)} ${sources}`);
    }

    console.log('-'.repeat(60));
    return outputData;

  } catch (error) {
    console.error('❌ Detection failed:', error);
    throw error;
  }
}

/**
 * Calculate overall trend direction based on narrative confidences
 */
function calculateTrendDirection(narratives: any[]): 'up' | 'down' | 'flat' {
  const avgConfidence = narratives.reduce((sum, n) => sum + n.confidence, 0) / narratives.length;
  if (avgConfidence > 0.6) return 'up';
  if (avgConfidence < 0.3) return 'down';
  return 'flat';
}

/**
 * Test individual collectors
 */
async function testCollectors() {
  console.log('\n🧪 Testing individual collectors...');
  console.log('=' .repeat(60));

  // Test GitHub collector
  console.log('\n🐙 Testing GitHub collector...');
  const githubCollector = new GitHubCollector();
  const githubData = await githubCollector.collect();
  console.log(`✅ GitHub: ${githubData.trendingRepos.length} trending, ${githubData.newRepos.length} new repos`);

  // Test social collector
  console.log('\n🐦 Testing Social collector...');
  const socialCollector = new SocialCollector();
  const socialData = await socialCollector.collect();
  console.log(`✅ Social: ${socialData.length} signals collected`);

  // Test Helius collector
  console.log('\n⛓️ Testing Helius collector...');
  const heliusCollector = new HeliusCollector();
  const heliusData = await heliusCollector.collect();
  console.log(`✅ Helius: Slot ${heliusData.slot}, ${heliusData.transactionVolume.txCount} txs`);

  console.log('\n✅ All collectors tested successfully');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Ensure directories exist
  ensureDirectories();

  switch (command) {
    case 'test':
      await testCollectors();
      break;

    case 'once':
      await runDetection();
      break;

    case 'cron':
    default:
      console.log('⚡ Solana Narrative Detector - Scheduler Mode');
      console.log('Runs every 15 minutes. Press Ctrl+C to stop.\n');

      // Run immediately on startup
      await runDetection();

      // Schedule to run every 15 minutes
      cron.schedule('*/15 * * * *', async () => {
        console.log('\n⏰ Scheduled run triggered');
        await runDetection();
      });

      // Also schedule hourly summary
      cron.schedule('0 * * * *', () => {
        console.log('\n📊 Hourly status: Detector is running...');
      });

      break;
  }
}

// Run main
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
