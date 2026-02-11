"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeDetector = void 0;
const helius_collector_js_1 = require("../collectors/helius-collector.js");
const github_collector_js_1 = require("../collectors/github-collector.js");
const social_collector_js_1 = require("../collectors/social-collector.js");
// Narrative categories with their defining keywords
const NARRATIVE_DEFINITIONS = [
    {
        id: 'defi-innovation',
        name: 'DeFi Innovation',
        keywords: ['yield', 'liquidity', 'AMM', 'vault', 'lending', 'borrow', 'stake', 'farm', 'dex', 'swap', 'perp', 'derivative'],
        description: 'Decentralized finance protocols and innovations'
    },
    {
        id: 'gaming-nft',
        name: 'Gaming & NFT',
        keywords: ['game', 'gaming', 'NFT', 'metaverse', 'play-to-earn', 'P2E', 'collectible', 'avatar', 'virtual', 'world'],
        description: 'Blockchain gaming and NFT ecosystems'
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure',
        keywords: ['validator', 'RPC', 'indexer', 'oracle', 'bridge', 'layer2', 'rollup', 'sequencer', 'node', 'network'],
        description: 'Core blockchain infrastructure and tooling'
    },
    {
        id: 'ai-crypto',
        name: 'AI x Crypto',
        keywords: ['AI', 'agent', 'model', 'inference', 'ML', 'machine learning', 'neural', 'autonomous', 'bot', 'intelligence'],
        description: 'Artificial intelligence meets blockchain'
    },
    {
        id: 'social-consumer',
        name: 'Social & Consumer',
        keywords: ['social', 'community', 'DAO', 'governance', 'vote', 'profile', 'content', 'creator', 'fan', 'engagement'],
        description: 'Social platforms and consumer applications'
    },
    {
        id: 'dev-tools',
        name: 'Developer Tools',
        keywords: ['SDK', 'framework', 'CLI', 'testing', 'debug', 'deploy', 'build', 'compile', 'library', 'API'],
        description: 'Tools and infrastructure for developers'
    }
];
class NarrativeDetector {
    heliusCollector;
    githubCollector;
    socialCollector;
    constructor() {
        this.heliusCollector = new helius_collector_js_1.HeliusCollector();
        this.githubCollector = new github_collector_js_1.GitHubCollector();
        this.socialCollector = new social_collector_js_1.SocialCollector();
    }
    async detectNarratives() {
        console.log('🔍 Starting narrative detection pipeline...');
        // Collect data from all sources
        console.log('📡 Collecting on-chain data from Helius...');
        const heliusData = await this.heliusCollector.collect();
        console.log('📡 Collecting GitHub repository data...');
        const githubData = await this.githubCollector.collect();
        console.log('📡 Collecting social signals...');
        const socialData = await this.socialCollector.collect();
        // Extract signals from raw data
        const signals = [
            ...this.extractHeliusSignals(heliusData),
            ...this.extractGitHubSignals(githubData),
            ...this.extractSocialSignals(socialData)
        ];
        console.log(`✅ Collected ${signals.length} total signals`);
        // Analyze signals to detect narratives
        const narratives = this.analyzeSignals(signals);
        return {
            timestamp: new Date().toISOString(),
            narratives: narratives.sort((a, b) => b.confidence - a.confidence)
        };
    }
    extractHeliusSignals(data) {
        const signals = [];
        // Process token transfers for DeFi signals
        if (data.tokenTransfers) {
            for (const transfer of data.tokenTransfers) {
                const keywords = this.extractKeywordsFromText(`${transfer.tokenName || ''} ${transfer.tokenSymbol || ''}`);
                if (keywords.length > 0) {
                    signals.push({
                        source: 'helius',
                        timestamp: data.timestamp,
                        keywords,
                        weight: 0.3,
                        metadata: { type: 'token', mint: transfer.mint }
                    });
                }
            }
        }
        // Process NFT events for Gaming/NFT signals
        if (data.nftEvents) {
            for (const event of data.nftEvents) {
                signals.push({
                    source: 'helius',
                    timestamp: data.timestamp,
                    keywords: ['NFT', 'collectible'],
                    weight: 0.4,
                    metadata: { type: 'nft', collection: event.collection }
                });
            }
        }
        // Process program interactions
        if (data.programInteractions) {
            for (const interaction of data.programInteractions) {
                const keywords = this.extractKeywordsFromText(interaction.programName || '');
                if (keywords.length > 0) {
                    signals.push({
                        source: 'helius',
                        timestamp: data.timestamp,
                        keywords,
                        weight: 0.5,
                        metadata: { type: 'program', programId: interaction.programId }
                    });
                }
            }
        }
        return signals;
    }
    extractGitHubSignals(data) {
        const signals = [];
        // Process trending repos
        for (const repo of data.trendingRepos || []) {
            const keywords = this.extractKeywordsFromText(`${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`);
            if (keywords.length > 0) {
                signals.push({
                    source: 'github',
                    timestamp: data.timestamp,
                    keywords,
                    weight: Math.min(0.5 + (repo.stars / 1000) * 0.3, 0.8),
                    metadata: {
                        type: 'repo',
                        name: repo.name,
                        stars: repo.stars,
                        url: repo.url
                    }
                });
            }
        }
        // Process new repos (higher weight for freshness)
        for (const repo of data.newRepos || []) {
            const keywords = this.extractKeywordsFromText(`${repo.name} ${repo.description || ''}`);
            if (keywords.length > 0) {
                signals.push({
                    source: 'github',
                    timestamp: data.timestamp,
                    keywords,
                    weight: 0.6, // Higher weight for new projects
                    metadata: {
                        type: 'new_repo',
                        name: repo.name,
                        createdAt: repo.createdAt
                    }
                });
            }
        }
        return signals;
    }
    extractSocialSignals(data) {
        const signals = [];
        for (const signal of data) {
            const keywords = signal.keywords || [];
            const engagement = signal.engagement || {};
            // Calculate weight based on engagement
            const engagementScore = ((engagement.likes || 0) +
                (engagement.retweets || 0) * 2 +
                (engagement.replies || 0) * 3) / 100;
            const weight = Math.min(0.4 + engagementScore * 0.4, 0.9);
            if (keywords.length > 0) {
                signals.push({
                    source: 'social',
                    timestamp: signal.timestamp,
                    keywords,
                    weight,
                    metadata: {
                        type: 'social',
                        author: signal.author,
                        content: signal.content?.substring(0, 100),
                        urls: signal.urls
                    }
                });
            }
        }
        return signals;
    }
    extractKeywordsFromText(text) {
        if (!text)
            return [];
        const lowerText = text.toLowerCase();
        const foundKeywords = [];
        for (const definition of NARRATIVE_DEFINITIONS) {
            for (const keyword of definition.keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    foundKeywords.push(keyword);
                }
            }
        }
        return [...new Set(foundKeywords)]; // Remove duplicates
    }
    analyzeSignals(signals) {
        const narratives = [];
        for (const definition of NARRATIVE_DEFINITIONS) {
            // Find all signals matching this narrative
            const matchingSignals = signals.filter(signal => signal.keywords.some(kw => definition.keywords.includes(kw.toLowerCase())));
            if (matchingSignals.length === 0) {
                // No signals - still create narrative with low confidence
                narratives.push(this.createEmptyNarrative(definition));
                continue;
            }
            // Calculate confidence based on signal count and weights
            const totalWeight = matchingSignals.reduce((sum, s) => sum + s.weight, 0);
            const confidence = Math.min(totalWeight / 5, 1); // Normalize, cap at 1.0
            // Extract trending keywords for this narrative
            const keywordCounts = new Map();
            for (const signal of matchingSignals) {
                for (const kw of signal.keywords) {
                    if (definition.keywords.includes(kw.toLowerCase())) {
                        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
                    }
                }
            }
            const trendingKeywords = Array.from(keywordCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([kw]) => kw);
            // Extract top projects from metadata
            const topProjects = matchingSignals
                .filter(s => s.metadata?.name || s.metadata?.programId)
                .slice(0, 5)
                .map(s => ({
                name: s.metadata.name || s.metadata.programId,
                description: s.metadata.description || '',
                url: s.metadata.url,
                source: s.source
            }));
            // Count data sources
            const dataSources = {
                helius: matchingSignals.filter(s => s.source === 'helius').length,
                github: matchingSignals.filter(s => s.source === 'github').length,
                social: matchingSignals.filter(s => s.source === 'social').length
            };
            narratives.push({
                id: definition.id,
                name: definition.name,
                description: definition.description,
                confidence,
                trendingKeywords,
                topProjects,
                projectIdeas: this.generateProjectIdeas(definition, trendingKeywords),
                dataSources,
                lastUpdated: new Date().toISOString()
            });
        }
        return narratives;
    }
    createEmptyNarrative(definition) {
        return {
            id: definition.id,
            name: definition.name,
            description: definition.description,
            confidence: 0.1,
            trendingKeywords: definition.keywords.slice(0, 5),
            topProjects: [],
            projectIdeas: this.generateProjectIdeas(definition, definition.keywords.slice(0, 3)),
            dataSources: { helius: 0, github: 0, social: 0 },
            lastUpdated: new Date().toISOString()
        };
    }
    generateProjectIdeas(definition, keywords) {
        const ideas = {
            'defi-innovation': [
                'Build a yield aggregator that auto-compounds across Solana DeFi protocols',
                'Create a decentralized lending platform with isolated risk markets',
                'Develop a perpetual DEX with advanced order types',
                'Build a liquidity mining analytics dashboard'
            ],
            'gaming-nft': [
                'Create a no-code NFT collection launcher with built-in marketplace',
                'Build a gaming guild management platform with scholarship tracking',
                'Develop an on-chain achievement system for games',
                'Create a metaverse land rental marketplace'
            ],
            'infrastructure': [
                'Build a decentralized RPC load balancer for Solana',
                'Create a validator performance monitoring dashboard',
                'Develop a bridge aggregator for cross-chain transfers',
                'Build an oracle comparison and aggregation service'
            ],
            'ai-crypto': [
                'Create an AI-powered trading assistant with on-chain execution',
                'Build a decentralized model marketplace for AI agents',
                'Develop an autonomous agent for DeFi yield optimization',
                'Create an AI content moderator for DAO governance'
            ],
            'social-consumer': [
                'Build a decentralized social graph protocol',
                'Create a creator monetization platform with micro-tipping',
                'Develop a DAO governance participation reward system',
                'Build a reputation-based social discovery app'
            ],
            'dev-tools': [
                'Create a Solana program testing framework with auto-generated tests',
                'Build a no-code contract deployment platform',
                'Develop a real-time program monitoring and alerting tool',
                'Create an IDE extension for Solana development'
            ]
        };
        return ideas[definition.id] || [
            `Build a ${keywords[0] || 'Solana'} analytics dashboard`,
            `Create a ${keywords[1] || 'web3'} automation tool`,
            `Develop a ${keywords[2] || 'blockchain'} integration service`
        ];
    }
}
exports.NarrativeDetector = NarrativeDetector;
