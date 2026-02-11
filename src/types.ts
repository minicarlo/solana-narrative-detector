// Types for Solana Narrative Detection Pipeline

export interface OnChainData {
  timestamp: string;
  slot: number;
  blockHeight: number;
  transactionVolume: {
    txCount: number;
    txPerSecond: number;
    volumeSpike: boolean;
  };
  newPrograms: NewProgram[];
  walletActivity: WalletActivity[];
}

export interface NewProgram {
  programId: string;
  deployer: string;
  blockTime: number;
  txSignature: string;
  size: number;
}

export interface WalletActivity {
  address: string;
  transactionCount: number;
  volumeUSD: number;
  interactedPrograms: string[];
}

export interface Instruction {
  programId: string;
  accounts: string[];
  data: string;
}

export interface TransactionLogMessage {
  signature: string;
  logs: string[];
  blockTime: number;
}

export interface GitHubData {
  timestamp: string;
  trendingRepos: GitHubRepo[];
  newRepos: GitHubRepo[];
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  createdAt: string;
  pushedAt: string;
  language: string;
  topics: string[];
}

export interface SocialSignal {
  timestamp: string;
  source: 'twitter' | 'other';
  author: string;
  content: string;
  urls: string[];
  keywords: string[];
  engagement?: {
    likes: number;
    retweets: number;
    replies: number;
  };
  createdAt: string;
}

export interface ReportData {
  timestamp: string;
  source: 'electric_capital' | 'messari' | 'helius';
  title: string;
  url: string;
  summary: string;
  publishDate: string;
}

export interface AggregatedData {
  timestamp: string;
  onChain: OnChainData | null;
  github: GitHubData | null;
  socialSignals: SocialSignal[];
  reports: ReportData[];
}

// Narrative Detection Types

export interface Idea {
  id?: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  narrativeId?: string;
}

export interface Narrative {
  id: string;
  name: string;
  description: string;
  confidence: number; // 0-1
  trendingKeywords: string[];
  topProjects: TopProject[];
  projectIdeas: string[];
  dataSources: DataSources;
  lastUpdated: string;
  // Legacy fields for compatibility
  title?: string;
  trend?: 'up' | 'down' | 'flat';
  sources?: ('on-chain' | 'github' | 'social')[];
  volume24h?: string;
  projects?: string[];
  ideas?: Idea[];
  scores?: {
    onChainScore: number;
    devScore: number;
    socialScore: number;
  };
  detectedAt?: string;
}

export interface NarrativeResult {
  lastUpdated: string;
  totalNarratives: number;
  trending: 'up' | 'down' | 'flat';
  narratives: Narrative[];
}

// Analysis Configuration

export interface NarrativeConfig {
  threshold: number; // Minimum confidence to be considered detected (default: 0.6)
  weights: {
    onChain: number;
    developer: number;
    social: number;
  };
  timeWindow: {
    recent: number; // Hours to weight as "recent" (default: 24)
    medium: number; // Hours for medium weight (default: 168 / 7 days)
  };
}

// Detection Patterns

export interface NarrativePattern {
  id: string;
  title: string;
  description: string;
  keywords: {
    primary: string[];
    secondary: string[];
    related: string[];
  };
  knownProjects: string[];
  difficultyModifiers: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
}

// New types for the detection pipeline

export interface ProjectIdea {
  title: string;
  description: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface TopProject {
  name: string;
  description?: string;
  url?: string;
  source?: string;
}

export interface DataSources {
  helius: number;
  github: number;
  social: number;
}

export interface NarrativeData {
  timestamp: string;
  narratives: Narrative[];
}
