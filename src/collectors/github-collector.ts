import fetch from 'node-fetch';
import { GitHubData, GitHubRepo } from '../types.js';

export class GitHubCollector {
  private apiBaseUrl = 'https://api.github.com';
  
  async collect(): Promise<GitHubData> {
    const now = new Date().toISOString();
    
    try {
      const trendingRepos = await this.fetchTrendingRepos();
      const newRepos = await this.fetchNewRepos();
      
      return {
        timestamp: now,
        trendingRepos,
        newRepos,
      };
    } catch (error) {
      console.error('GitHub collection error:', error);
      return {
        timestamp: now,
        trendingRepos: [],
        newRepos: [],
      };
    }
  }

  private async fetchTrendingRepos(): Promise<GitHubRepo[]> {
    // Repos with "solana" topic sorted by stars in last 7 days
    const query = 'topic:solana sort:stars-desc pushed:>' + this.getWeekAgoDate();
    const url = `${this.apiBaseUrl}/search/repositories?q=${encodeURIComponent(query)}&per_page=20`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Solana-Narrative-Detector',
        },
      });
      
      if (!response.ok) {
        console.warn(`GitHub API warning: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json() as { items: any[] };
      return this.parseRepos(data.items || []);
    } catch (error) {
      console.error('Error fetching trending repos:', error);
      return [];
    }
  }

  private async fetchNewRepos(): Promise<GitHubRepo[]> {
    // Repos created in last 7 days with "solana" keyword
    const query = 'solana created:>' + this.getWeekAgoDate();
    const url = `${this.apiBaseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Solana-Narrative-Detector',
        },
      });
      
      if (!response.ok) {
        console.warn(`GitHub API warning: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json() as { items: any[] };
      return this.parseRepos(data.items || []);
    } catch (error) {
      console.error('Error fetching new repos:', error);
      return [];
    }
  }

  private parseRepos(items: any[]): GitHubRepo[] {
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

  private getWeekAgoDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }
}
