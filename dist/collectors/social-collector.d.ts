import { SocialSignal } from '../types.js';
export declare class SocialCollector {
    private kolAccounts;
    private keywords;
    collect(): Promise<SocialSignal[]>;
    private scrapeTwitterAccount;
    private parseNitterHtml;
    private cleanHtml;
    private extractUrls;
    private extractKeywords;
    private parseDate;
    private generateSampleData;
}
//# sourceMappingURL=social-collector.d.ts.map