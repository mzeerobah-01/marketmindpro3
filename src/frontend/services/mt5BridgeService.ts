import { CandleData, TickData } from '../types';

export interface MT5AccountStatus {
  accountNumber: string;
  server: string;
  balance: number;
  equity: number;
  currency: string;
  freeMargin: number;
  leverage: number;
}

export interface MT5BridgeStatus {
  bridgeStatus: 'online' | 'standby';
  isTerminalConnected: boolean;
  lastPacketReceived: number;
  latencyMs: number;
  connectedAccountsCount: number;
  accounts: MT5AccountStatus[];
}

class MT5BridgeService {
  private pollInterval: any = null;
  private currentSymbol: string = 'EURUSD';
  private isConnected: boolean = false;
  private latency: number = 12;

  // Listeners
  private onTickListeners: ((tick: TickData, symbol: string) => void)[] = [];
  private onStatusListeners: ((status: MT5BridgeStatus) => void)[] = [];

  constructor() {
    this.startPolling();
  }

  public setSymbol(symbol: string) {
    this.currentSymbol = symbol.toUpperCase().replace(/[\/\-_]/g, '');
  }

  public startPolling(intervalMs: number = 1000): void {
    this.stopPolling();
    this.pollInterval = setInterval(async () => {
      await this.pollMarketData();
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async pollMarketData(): Promise<void> {
    try {
      const cleanSymbol = this.currentSymbol;
      const res = await fetch(`/api/mt5/market/${cleanSymbol}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.state && data.state.recentTicks && data.state.recentTicks.length > 0) {
        const lastTick = data.state.recentTicks[data.state.recentTicks.length - 1];
        this.onTickListeners.forEach(cb => cb(lastTick, cleanSymbol));
      }
    } catch (e) {
      // Standby mode
    }
  }

  public async fetchBridgeStatus(): Promise<MT5BridgeStatus | null> {
    try {
      const res = await fetch('/api/mt5/status');
      if (!res.ok) return null;
      const status: MT5BridgeStatus = await res.json();
      this.isConnected = status.isTerminalConnected;
      this.latency = status.latencyMs;
      this.onStatusListeners.forEach(cb => cb(status));
      return status;
    } catch (e) {
      return null;
    }
  }

  public onTick(callback: (tick: TickData, symbol: string) => void): () => void {
    this.onTickListeners.push(callback);
    return () => {
      this.onTickListeners = this.onTickListeners.filter(cb => cb !== callback);
    };
  }

  public onStatus(callback: (status: MT5BridgeStatus) => void): () => void {
    this.onStatusListeners.push(callback);
    return () => {
      this.onStatusListeners = this.onStatusListeners.filter(cb => cb !== callback);
    };
  }
}

export const mt5Bridge = new MT5BridgeService();
