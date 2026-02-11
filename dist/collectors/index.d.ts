import { OnChainData, GitHubData, SocialSignal } from '../types.js';
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
export declare function collectAll(): Promise<CollectResult>;
/**
 * Save collected data to aggregated file
 * @param data The data to save
 * @param baseDir Base directory for the project
 * @returns Path to saved file
 */
export declare function saveAggregatedData(data: CollectResult, baseDir?: string): Promise<string>;
/**
 * Run full pipeline: collect and save
 * @param baseDir Base directory for the project
 */
export declare function runPipeline(baseDir?: string): Promise<{
    result: CollectResult;
    filepath: string;
}>;
//# sourceMappingURL=index.d.ts.map