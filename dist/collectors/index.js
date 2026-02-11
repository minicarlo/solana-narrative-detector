"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialCollector = exports.GitHubCollector = exports.HeliusCollector = void 0;
exports.collectAll = collectAll;
exports.saveAggregatedData = saveAggregatedData;
exports.runPipeline = runPipeline;
const helius_collector_js_1 = require("./helius-collector.js");
const github_collector_js_1 = require("./github-collector.js");
const social_collector_js_1 = require("./social-collector.js");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// Re-export all collectors
var helius_collector_js_2 = require("./helius-collector.js");
Object.defineProperty(exports, "HeliusCollector", { enumerable: true, get: function () { return helius_collector_js_2.HeliusCollector; } });
var github_collector_js_2 = require("./github-collector.js");
Object.defineProperty(exports, "GitHubCollector", { enumerable: true, get: function () { return github_collector_js_2.GitHubCollector; } });
var social_collector_js_2 = require("./social-collector.js");
Object.defineProperty(exports, "SocialCollector", { enumerable: true, get: function () { return social_collector_js_2.SocialCollector; } });
/**
 * Collect data from all sources: Helius (on-chain), GitHub, Social
 * @returns Aggregated data from all collectors
 */
async function collectAll() {
    const now = new Date().toISOString();
    const errors = [];
    console.log('🚀 Starting data collection pipeline...\n');
    // Initialize collectors  
    const heliusCollector = new helius_collector_js_1.HeliusCollector();
    const githubCollector = new github_collector_js_1.GitHubCollector();
    const socialCollector = new social_collector_js_1.SocialCollector();
    // Collect from all sources
    let onChain = null;
    let github = null;
    let socialSignals = [];
    // 1. Helius Collection (On-chain data)
    try {
        console.log('🔗 Collecting on-chain data from Helius...');
        onChain = await heliusCollector.collect();
        console.log(`   ✓ Block height: ${onChain.blockHeight}`);
        console.log(`   ✓ New programs detected: ${onChain.newPrograms.length}`);
        console.log(`   ✓ Active wallets: ${onChain.walletActivity.length}`);
        console.log(`   ✓ TPS: ${onChain.transactionVolume.txPerSecond.toFixed(2)}\n`);
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
async function saveAggregatedData(data, baseDir = process.cwd()) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dateDir = now.toISOString().split('T')[0];
    // Create directory structure: data/aggregated/YYYY-MM-DD/
    const outputDir = path_1.default.join(baseDir, 'data', 'aggregated', dateDir);
    await fs_1.promises.mkdir(outputDir, { recursive: true });
    const filename = `${timestamp}.json`;
    const filepath = path_1.default.join(outputDir, filename);
    // Build reports (empty for now - can be extended)
    const aggregatedData = {
        timestamp: data.onChain?.timestamp || data.github?.timestamp || new Date().toISOString(),
        onChain: data.onChain,
        github: data.github,
        socialSignals: data.socialSignals,
        reports: [], // Reports can be added by a separate reports collector
    };
    await fs_1.promises.writeFile(filepath, JSON.stringify(aggregatedData, null, 2));
    console.log(`💾 Data saved to: ${filepath}`);
    return filepath;
}
/**
 * Run full pipeline: collect and save
 * @param baseDir Base directory for the project
 */
async function runPipeline(baseDir = process.cwd()) {
    const result = await collectAll();
    const filepath = await saveAggregatedData(result, baseDir);
    return { result, filepath };
}
