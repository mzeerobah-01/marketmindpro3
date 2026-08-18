import { CandleData, MarketAsset, TickData } from '../types';
import { extractLastDigit } from './marketDataService';

export interface DerivAccountInfo {
  loginid: string;
  email: string;
  balance: number;
  currency: string;
  isVirtual: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'authorized' | 'error';

class DerivWebSocketService {
  private ws: WebSocket | null = null;
  private appId: string = '1089';
  private token: string = '';
  private currentSymbol: string | null = null;
  private tickSubscriptionId: string | null = null;
  private candleSubscriptionId: string | null = null;
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private isIntentionalClose: boolean = false;
  private latency: number = 0;
  private lastPingSent: number = 0;

  private status: ConnectionStatus = 'disconnected';
  private accountInfo: DerivAccountInfo | null = null;

  // Listeners
  private onTickListeners: ((tick: TickData, symbol: string) => void)[] = [];
  private onCandlesListeners: ((candles: CandleData[], symbol: string) => void)[] = [];
  private onStatusListeners: ((status: ConnectionStatus, info?: { latency: number; error?: string }) => void)[] = [];
  private onAccountListeners: ((account: DerivAccountInfo) => void)[] = [];

  constructor() {
    // Load stored settings from localStorage if available
    if (typeof window !== 'undefined') {
      const storedAppId = localStorage.getItem('mmp_deriv_app_id');
      const storedToken = localStorage.getItem('mmp_deriv_token');
      if (storedAppId) this.appId = storedAppId;
      if (storedToken) this.token = storedToken;
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getLatency(): number {
    return this.latency;
  }

  public getAccountInfo(): DerivAccountInfo | null {
    return this.accountInfo;
  }

  public getAppId(): string {
    return this.appId;
  }

  public getToken(): string {
    return this.token;
  }

  public setCredentials(appId?: string, token?: string) {
    if (appId) {
      this.appId = appId.trim();
      if (typeof window !== 'undefined') localStorage.setItem('mmp_deriv_app_id', this.appId);
    }
    if (token !== undefined) {
      this.token = token.trim();
      if (typeof window !== 'undefined') localStorage.setItem('mmp_deriv_token', this.token);
    }
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionalClose = false;
    this.updateStatus('connecting');

    try {
      const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId || '1089'}&l=en&brand=deriv`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.updateStatus('connected');
        this.startKeepAlive();

        // If user provided a token, authorize immediately
        if (this.token) {
          this.authorize(this.token);
        }

        // If a symbol was selected, resubscribe
        if (this.currentSymbol) {
          this.subscribeToSymbol(this.currentSymbol);
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('[DerivWS] Failed to parse message', e);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[DerivWS] Socket error', error);
        this.updateStatus('error', { latency: this.latency, error: 'Connection error' });
      };

      this.ws.onclose = (event) => {
        this.stopKeepAlive();
        this.updateStatus('disconnected');
        if (!this.isIntentionalClose) {
          // Auto-reconnect after 3 seconds
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };
    } catch (err: any) {
      console.error('[DerivWS] Connection init failed', err);
      this.updateStatus('error', { latency: 0, error: err.message });
    }
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    clearTimeout(this.reconnectTimeout);
    this.stopKeepAlive();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  public authorize(token: string): void {
    this.token = token.trim();
    if (typeof window !== 'undefined') localStorage.setItem('mmp_deriv_token', this.token);
    this.send({ authorize: this.token });
  }

  public subscribeToSymbol(symbol: string): void {
    this.currentSymbol = symbol;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
      return;
    }

    // Unsubscribe previous tick/candle streams to avoid multi-stream collisions
    this.send({ forget_all: ['ticks', 'candles'] });

    // Request initial 1-minute candles history + live candle subscription
    this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 70,
      end: 'latest',
      start: 1,
      style: 'candles',
      granularity: 60, // 1 min candles
      subscribe: 1,
    });

    // Request live tick stream
    this.send({
      ticks: symbol,
      subscribe: 1,
    });
  }

  private send(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private handleMessage(data: any): void {
    const msgType = data.msg_type;

    // 1. Handle Ping / Pong for Latency measurement
    if (msgType === 'ping' || data.ping === 'pong') {
      if (this.lastPingSent > 0) {
        this.latency = Math.max(1, Date.now() - this.lastPingSent);
        this.notifyStatusListeners();
      }
      return;
    }

    // 2. Handle Authorize Response
    if (msgType === 'authorize') {
      if (data.error) {
        console.warn('[DerivWS] Auth error:', data.error.message);
        this.updateStatus('connected', { latency: this.latency, error: data.error.message });
      } else {
        const authData = data.authorize;
        this.accountInfo = {
          loginid: authData.loginid,
          email: authData.email,
          balance: Number(authData.balance || 0),
          currency: authData.currency || 'USD',
          isVirtual: Boolean(authData.is_virtual),
        };
        this.updateStatus('authorized');
        this.onAccountListeners.forEach(cb => cb(this.accountInfo!));
      }
      return;
    }

    // 3. Handle Balance updates
    if (msgType === 'balance' && data.balance && this.accountInfo) {
      this.accountInfo.balance = Number(data.balance.balance);
      this.accountInfo.currency = data.balance.currency;
      this.onAccountListeners.forEach(cb => cb(this.accountInfo!));
    }

    // 4. Handle Live Tick Stream
    if (msgType === 'tick' && data.tick) {
      const tickObj = data.tick;
      const rawPrice = Number(tickObj.quote);
      const symbol = tickObj.symbol;

      // Extract precision from decimals or default 2
      const quoteStr = String(tickObj.quote);
      const decimalMatch = quoteStr.split('.')[1];
      const digits = decimalMatch ? decimalMatch.length : 2;
      const lastDigit = extractLastDigit(rawPrice, digits);

      const tickData: TickData = {
        id: Number(tickObj.epoch * 1000),
        timestamp: Number(tickObj.epoch * 1000),
        price: rawPrice,
        lastDigit,
        direction: 'up', // updated dynamically by frontend
      };

      this.onTickListeners.forEach(cb => cb(tickData, symbol));
      return;
    }

    // 5. Handle Historical Candles
    if (msgType === 'candles' && Array.isArray(data.candles)) {
      const candles: CandleData[] = data.candles.map((c: any) => ({
        time: Number(c.epoch * 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: 100,
      }));
      const symbol = data.echo_req?.ticks_history || this.currentSymbol || '';
      this.onCandlesListeners.forEach(cb => cb(candles, symbol));
      return;
    }

    // 6. Handle Live OHLC Candle updates
    if (msgType === 'ohlc' && data.ohlc) {
      const o = data.ohlc;
      const candle: CandleData = {
        time: Number(o.open_time * 1000),
        open: Number(o.open),
        high: Number(o.high),
        low: Number(o.low),
        close: Number(o.close),
        volume: 100,
      };
      const symbol = o.symbol;
      this.onCandlesListeners.forEach(cb => cb([candle], symbol));
    }
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSent = Date.now();
        this.send({ ping: 1 });
      }
    }, 25000);
  }

  private stopKeepAlive(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private updateStatus(status: ConnectionStatus, info?: { latency: number; error?: string }): void {
    this.status = status;
    if (info?.latency) this.latency = info.latency;
    this.notifyStatusListeners(info?.error);
  }

  private notifyStatusListeners(error?: string): void {
    this.onStatusListeners.forEach(cb => cb(this.status, { latency: this.latency, error }));
  }

  // Listener subscriptions
  public onTick(callback: (tick: TickData, symbol: string) => void): () => void {
    this.onTickListeners.push(callback);
    return () => {
      this.onTickListeners = this.onTickListeners.filter(cb => cb !== callback);
    };
  }

  public onCandles(callback: (candles: CandleData[], symbol: string) => void): () => void {
    this.onCandlesListeners.push(callback);
    return () => {
      this.onCandlesListeners = this.onCandlesListeners.filter(cb => cb !== callback);
    };
  }

  public onStatus(callback: (status: ConnectionStatus, info?: { latency: number; error?: string }) => void): () => void {
    this.onStatusListeners.push(callback);
    return () => {
      this.onStatusListeners = this.onStatusListeners.filter(cb => cb !== callback);
    };
  }

  public onAccount(callback: (account: DerivAccountInfo) => void): () => void {
    this.onAccountListeners.push(callback);
    return () => {
      this.onAccountListeners = this.onAccountListeners.filter(cb => cb !== callback);
    };
  }
}

export const derivWebSocket = new DerivWebSocketService();
