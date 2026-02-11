import { NarrativeDetector } from './analyzer/narrative-detector.js';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('🚀 Solana Narrative Detection Pipeline');
    console.log('=====================================\n');

    try {
        const detector = new NarrativeDetector();
        const data = await detector.detectNarratives();

        // Ensure data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write narratives data
        const outputPath = path.join(dataDir, 'narratives.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log('\n✅ Detection complete!');
        console.log(`📊 Detected ${data.narratives.length} narratives`);
        console.log(`💾 Data saved to: ${outputPath}`);
        
        // Print summary
        console.log('\n📈 Narrative Summary:');
        console.log('-------------------');
        for (const narrative of data.narratives) {
            const confidence = Math.round(narrative.confidence * 100);
            const bar = '█'.repeat(Math.floor(confidence / 10)) + '░'.repeat(10 - Math.floor(confidence / 10));
            console.log(`${bar} ${confidence}% - ${narrative.name}`);
        }

    } catch (error) {
        console.error('❌ Detection failed:', error);
        process.exit(1);
    }
}

main();
