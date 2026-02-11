import { HeliusCollector } from './helius-collector.js';
import { GitHubCollector } from './github-collector.js';
import { SocialCollector } from './social-collector.js';
import { AggregatedData, OnChainData, GitHubData, SocialSignal } from '../types.js';
import { promises as fs } from 'fs';
import path from 'path';

// Re-export all collectors
export { HeliusCollector } from './helius-collector.js';
export { GitHubCollector } from './github-collector.js';
export { SocialCollector } from './social-collector.js';

export interface CollectResult {
  success: boolean;
  onChain: OnChainData | null;
  github: GitHubData | null;
  socialSignals: SocialSignal[];
  errors: string[];
}

/**
 * Collect data from all sources: Helius (on-chain), GitHub, Social
 * @returns Aggregated data from all collectors
 */
export async function collectAll(): Promise<CollectResult> {
  const now = new Date().toISOString();
  const errors: string[] = [];
  
  console.log('🚀 Starting data collection pipeline...\n');
  
  // Initialize collectors  
  const heliusCollector = new HeliusCollector();
  const githubCollector = new GitHubCollector();
  const socialCollector = new SocialCollector();
  
  // Collect from all sources
  let onChain: OnChainData | null = null;
  let github: GitHubData | null = null;
  let socialSignals: SocialSignal[] = [];
  
  // 1. Helius Collection (On-chain data)
  try {
    console.log('🔗 Collecting on-chain data from Helius...');
    onChain = await heliusCollector.collect();
    console.log(`   ✓ Block height: ${onChain.blockHeight}`);
    console.log(`   ✓ New programs detected: ${onChain.newPrograms.length}`);
    console.log(`   ✓ Active wallets: ${onChain.walletActivity.length}`);
    console.log(`   ✓ TPS: ${onChain.transactionVolume.txPerSecond.toFixed(2)}\n`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`Helius: ${msg}`);
    console.error('   ✗ Helius collection failed:', msg, '\n');
  }
  
  // 2. GitHub Collection
  try {
    console.log('📦 Collecting GitHub repository data...');
    github = await githubCollector.collect();
    console.log(`   ✓ Trending repos: ${github.trendingRepos.length}`);
    console.log(`   ✓ New repos (7d): ${github.newRepos.length}`);
    if (github.trendingRepos.length > 0) {
      console.log(`   ✓ Top trending: ${github.trendingRepos[0]?.fullName} (${github.trendingRepos[0]?.stars} stars)`);
    }
    console.log('');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`GitHub: ${msg}`);
    console.error('   ✗ GitHub collection failed:', msg, '\n');
  }
  
  // 3. Social Signal Collection
  try {
    console.log('📱 Collecting social signals from KOLs...');
    socialSignals = await socialCollector.collect();
    console.log(`   ✓ Signals found: ${socialSignals.length}`);
    const uniqueKeywords = new Set(socialSignals.flatMap(s => s.keywords));
    console.log(`   ✓ Keywords matched: ${Array.from(uniqueKeywords).join(', ')}`);
    console.log('');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`Social: ${msg}`);
    console.error('   ✗ Social collection failed:', msg, '\n');
  }
  
  // Calculate success
  const success = onChain !== null || github !== null || socialSignals.length > 0;
  
  console.log('📊 Collection Summary:');
  console.log(`   • On-chain: ${onChain ? '✅' : '❌'}`);
  console.log(`   • GitHub: ${github ? '✅' : '❌'}`);
  console.log(`   • Social: ${socialSignals.length > 0 ? '✅' : '❌'}`);
  console.log(`   • Errors: ${errors.length}`);
  console.log(`   • Overall: ${success ? 'SUCCESS' : 'FAILED'}\n`);
  
  return {
    success,
    onChain,
    github,
    socialSignals,
    errors,
  };
}

/**
 * Save collected data to aggregated file
 * @param data The data to save
 * @param baseDir Base directory for the project
 * @returns Path to saved file
 */
export async function saveAggregatedData(
  data: CollectResult,
  baseDir: string = process.cwd()
): Promise<string> {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dateDir = now.toISOString().split('T')[0];
  
  // Create directory structure: data/aggregated/YYYY-MM-DD/
  const outputDir = path.join(baseDir, 'data', 'aggregated', dateDir);
  await fs.mkdir(outputDir, { recursive: true });
  
  const filename = `${timestamp}.json`;
  const filepath = path.join(outputDir, filename);
  
  // Build reports (empty for now - can be extended)
  const aggregatedData: AggregatedData = {
    timestamp: data.onChain?.timestamp || data.github?.timestamp || new Date().toISOString(),
    onChain: data.onChain,
    github: data.github,
    socialSignals: data.socialSignals,
    reports: [], // Reports can be added by a separate reports collector
  };
  
  await fs.writeFile(filepath, JSON.stringify(aggregatedData, null, 2));
  console.log(`💾 Data saved to: ${filepath}`);
  
  return filepath;
}

/**
 * Run full pipeline: collect and save
 * @param baseDir Base directory for the project
 */
export async function runPipeline(baseDir: string = process.cwd()): Promise<{
  result: CollectResult;
  filepath: string;
}> {
  const result = await collectAll();
  const filepath = await saveAggregatedData(result, baseDir);
  
  return { result, filepath };
}
