import { OnChainData } from '../types.js';
export declare class HeliusCollector {
    private apiKey;
    private rpcUrl;
    constructor(apiKey?: string);
    collect(): Promise<OnChainData>;
    private getSlot;
    private getBlockHeight;
    private getRecentSignatures;
    private analyzeTransactionVolume;
    private detectNewPrograms;
    private analyzeWalletActivity;
    private getTransactionDetails;
}
//# sourceMappingURL=helius-collector.d.ts.map