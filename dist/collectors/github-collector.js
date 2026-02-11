"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCollector = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class GitHubCollector {
    apiBaseUrl = 'https://api.github.com';
    async collect() {
        const now = new Date().toISOString();
        try {
            const trendingRepos = await this.fetchTrendingRepos();
            const newRepos = await this.fetchNewRepos();
            return {
                timestamp: now,
                trendingRepos,
                newRepos,
            };
        }
        catch (error) {
            console.error('GitHub collection error:', error);
            return {
                timestamp: now,
                trendingRepos: [],
                newRepos: [],
            };
        }
    }
    async fetchTrendingRepos() {
        // Repos with "solana" topic sorted by stars in last 7 days
        const query = 'topic:solana sort:stars-desc pushed:>' + this.getWeekAgoDate();
        const url = `${this.apiBaseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=20`;
        try {
            const response = await (0, node_fetch_1.default)(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Solana-Narrative-Detector',
                },
            });
            if (!response.ok) {
                console.warn(`GitHub API warning: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            return this.parseRepos(data.items || []);
        }
        catch (error) {
            console.error('Error fetching trending repos:', error);
            return [];
        }
    }
    async fetchNewRepos() {
        // Repos created in last 7 days with "solana" keyword
        const query = 'solana created:>' + this.getWeekAgoDate();
        const url = `${this.apiBaseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`;
        try {
            const response = await (0, node_fetch_1.default)(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Solana-Narrative-Detector',
                },
            });
            if (!response.ok) {
                console.warn(`GitHub API warning: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            return this.parseRepos(data.items || []);
        }
        catch (error) {
            console.error('Error fetching new repos:', error);
            return [];
        }
    }
    parseRepos(items) {
        return items.map((item) => ({
            id: item.id,
            name: item.name,
            fullName: item.full_name,
            description: item.description,
            url: item.html_url,
            stars: item.stargazers_count,
            createdAt: item.created_at,
            pushedAt: item.pushed_at,
            language: item.language || 'TypeScript',
            topics: item.topics || [],
        }));
    }
    getWeekAgoDate() {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    }
}
exports.GitHubCollector = GitHubCollector;
