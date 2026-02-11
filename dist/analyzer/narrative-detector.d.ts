import { NarrativeData } from '../types.js';
export declare class NarrativeDetector {
    private heliusCollector;
    private githubCollector;
    private socialCollector;
    constructor();
    detectNarratives(): Promise<NarrativeData>;
    private extractHeliusSignals;
    private extractGitHubSignals;
    private extractSocialSignals;
    private extractKeywordsFromText;
    private analyzeSignals;
    private createEmptyNarrative;
    private generateProjectIdeas;
}
//# sourceMappingURL=narrative-detector.d.ts.map