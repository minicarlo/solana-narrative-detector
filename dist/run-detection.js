"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const narrative_detector_js_1 = require("./analyzer/narrative-detector.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    console.log('🚀 Solana Narrative Detection Pipeline');
    console.log('=====================================\n');
    try {
        const detector = new narrative_detector_js_1.NarrativeDetector();
        const data = await detector.detectNarratives();
        // Ensure data directory exists
        const dataDir = path_1.default.join(process.cwd(), 'data');
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        // Write narratives data
        const outputPath = path_1.default.join(dataDir, 'narratives.json');
        fs_1.default.writeFileSync(outputPath, JSON.stringify(data, null, 2));
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
    }
    catch (error) {
        console.error('❌ Detection failed:', error);
        process.exit(1);
    }
}
main();
