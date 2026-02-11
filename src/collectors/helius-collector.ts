import fetch from 'node-fetch';
import { OnChainData, NewProgram, WalletActivity, Instruction, TransactionLogMessage } from '../types.js';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '99dbd914-ccbe-4e7d-8b23-c9d24cb34483';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// SPL Token Program and commonly deployed programs
const PROGRAM_IDS = {
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022_PROGRAM: 'TokenzQdBNbLqP5VEhdkALS6pFiNd9jaYLrduYWVvVY',
  ASSOCIATED_TOKEN_ACCOUNT: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efjNsSRpTt2H',
  SYSTEM_PROGRAM: '11111111111111111111111111111111',
};

export class HeliusCollector {
  private apiKey: string;
  private rpcUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || HELIUS_API_KEY;
    this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;
  }

  async collect(): Promise<OnChainData> {
    const now = new Date().toISOString();
    try {
      // Get current slot
      const slot = await this.getSlot();

      // Get recent transaction signatures
      const signatures = await this.getRecentSignatures(100);

      // Analyze transaction volume
      const volumeData = await this.analyzeTransactionVolume(signatures);

      // Detect new program deployments
      const newPrograms = await this.detectNewPrograms(signatures);

      // Analyze wallet activity
      const walletActivity = await this.analyzeWalletActivity(signatures);

      return {
        timestamp: now,
        slot,
        blockHeight: await this.getBlockHeight(),
        transactionVolume: volumeData,
        newPrograms,
        walletActivity,
      };
    } catch (error) {
      console.error('Helius collection error:', error);
      return {
        timestamp: now,
        slot: 0,
        blockHeight: 0,
        transactionVolume: {
          txCount: 0,
          txPerSecond: 0,
          volumeSpike: false,
        },
        newPrograms: [],
        walletActivity: [],
      };
    }
  }

  private async getSlot(): Promise<number> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSlot',
      }),
    });
    const data = await response.json() as { result: number };
    return data.result;
  }

  private async getBlockHeight(): Promise<number> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBlockHeight',
      }),
    });
    const data = await response.json() as { result: number };
    return data.result;
  }

  private async getRecentSignatures(limit: number = 100): Promise<string[]> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          'Vote111111111111111111111111111111111111111',
          { limit },
        ],
      }),
    });
    const data = await response.json() as { result: Array<{ signature: string }> };
    return data.result.map((tx) => tx.signature);
  }

  private async analyzeTransactionVolume(signatures: string[]): Promise<{ txCount: number; txPerSecond: number; volumeSpike: boolean; }> {
    const txCount = signatures.length;
    // Rough TPS calculation (last 100 tx over ~5 seconds = ~20 TPS normal)
    const txPerSecond = txCount / 5;
    const volumeSpike = txPerSecond > 50; // Spike if >50 TPS
    return {
      txCount,
      txPerSecond,
      volumeSpike,
    };
  }

  private async detectNewPrograms(signatures: string[]): Promise<NewProgram[]> {
    const newPrograms: NewProgram[] = [];

    // Check recent signatures for program deployments
    for (const signature of signatures.slice(0, 20)) {
      try {
        const txDetails = await this.getTransactionDetails(signature);
        if (txDetails?.meta?.logMessages) {
          // Check for program deployment logs
          const logMessages = txDetails.meta.logMessages as string[];
          const deployLogs = logMessages.filter(
            (log: string) => log.includes('Program loaded') || log.includes('Deploy')
          );

          if (deployLogs.length > 0) {
            const programMatch = deployLogs[0].match(/[A-Za-z0-9]{32,44}/);
            if (programMatch) {
              const accountKeys = txDetails.transaction.message.accountKeys;
              const signer = accountKeys.find((acc: { signer: boolean }) => acc.signer);
              newPrograms.push({
                programId: programMatch[0],
                deployer: signer?.pubkey?.toString() || '',
                blockTime: txDetails.blockTime || 0,
                txSignature: signature,
                size: txDetails.meta.postBalances[0] - txDetails.meta.preBalances[0],
              });
            }
          }
        }
      } catch (e) {
        // Skip failed transactions
      }
    }

    return newPrograms;
  }

  private async analyzeWalletActivity(signatures: string[]): Promise<WalletActivity[]> {
    const walletMap = new Map<string, { txCount: number; programs: Set<string> }>();

    for (const signature of signatures.slice(0, 50)) {
      try {
        const txDetails = await this.getTransactionDetails(signature);
        if (txDetails?.transaction?.message?.accountKeys) {
          const accounts = txDetails.transaction.message.accountKeys;
          const signer = accounts.find((acc: { signer: boolean }) => acc.signer);
          
          if (signer) {
            const address: string = signer.pubkey.toString();
            const current = walletMap.get(address) || { txCount: 0, programs: new Set<string>() };
            current.txCount++;

            // Track program interactions
            if (txDetails.transaction.message.instructions) {
              const instructions = txDetails.transaction.message.instructions;
              instructions.forEach((ix: { programId?: { toString: () => string } }) => {
                if (ix.programId) {
                  current.programs.add(ix.programId.toString());
                }
              });
            }

            walletMap.set(address, current);
          }
        }
      } catch (e) {
        // Skip failed transactions
      }
    }

    return Array.from(walletMap.entries())
      .map(([address, data]) => ({
        address,
        transactionCount: data.txCount,
        volumeUSD: 0, // Would need price oracle
        interactedPrograms: Array.from(data.programs).slice(0, 10),
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 20);
  }

  private async getTransactionDetails(signature: string): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [
          signature,
          { encoding: 'jsonParsed', commitment: 'confirmed' },
        ],
      }),
    });
    const data = await response.json() as { result: any };
    return data.result;
  }
}
