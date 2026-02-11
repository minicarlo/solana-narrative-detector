"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./collectors/index.js");
async function main() {
    console.log('='.repeat(60));
    console.log('Solana Narrative Detection - Pipeline Test');
    console.log('='.repeat(60) + '\n');
    try {
        // Run the full pipeline
        const { result, filepath } = await (0, index_js_1.runPipeline)();
        // Output summary
        console.log('\n' + '='.repeat(60));
        console.log('Test Results');
        console.log('='.repeat(60));
        console.log('\n✅ Pipeline completed successfully!');
        console.log(`\n📁 Data saved to: ${filepath}`);
        console.log('\n📈 On-Chain Data:');
        if (result.onChain) {
            console.log(`   • Block Height: ${result.onChain.blockHeight}`);
            console.log(`   • Slot: ${result.onChain.slot}`);
            console.log(`   • Tx Count: ${result.onChain.transactionVolume.txCount}`);
            console.log(`   • Tx/s: ${result.onChain.transactionVolume.txPerSecond.toFixed(2)}`);
            console.log(`   • New Programs: ${result.onChain.newPrograms.length}`);
            console.log(`   • Active Wallets: ${result.onChain.walletActivity.length}`);
        }
        else {
            console.log('   • No data collected');
        }
        console.log('\n🐙 GitHub Data:');
        if (result.github) {
            console.log(`   • Trending Repos: ${result.github.trendingRepos.length}`);
            console.log(`   • New Repos (7d): ${result.github.newRepos.length}`);
        }
        else {
            console.log('   • No data collected');
        }
        console.log('\n📱 Social Signals:');
        console.log(`   • Total Signals: ${result.socialSignals.length}`);
        if (result.socialSignals.length > 0) {
            const keywordCounts = {};
            result.socialSignals.forEach(s => {
                s.keywords.forEach(k => {
                    keywordCounts[k] = (keywordCounts[k] || 0) + 1;
                });
            });
            console.log('   • Keyword distribution:');
            Object.entries(keywordCounts).forEach(([k, v]) => {
                console.log(`     - "${k}": ${v} mentions`);
            });
        }
        if (result.errors.length > 0) {
            console.log('\n⚠️ Errors encountered:');
            result.errors.forEach(e => console.log(`   • ${e}`));
        }
        // Success check
        if (result.success) {
            console.log('\n' + '✅'.repeat(20));
            console.log('ALL COLLECTORS FUNCTIONAL');
            console.log('✅'.repeat(20));
            process.exit(0);
        }
        else {
            console.log('\n' + '❌'.repeat(20));
            console.log('PIPELINE FAILED');
            console.log('❌'.repeat(20));
            process.exit(1);
        }
    }
    catch (error) {
        console.error('\n❌ Pipeline test failed:', error);
        process.exit(1);
    }
}
main();
