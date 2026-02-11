import { GitHubData } from '../types.js';
export declare class GitHubCollector {
    private apiBaseUrl;
    collect(): Promise<GitHubData>;
    private fetchTrendingRepos;
    private fetchNewRepos;
    private parseRepos;
    private getWeekAgoDate;
}
//# sourceMappingURL=github-collector.d.ts.map