import { CandleData, DigitStat, MarketAsset, StrategyScore, TickData, SmcOverlay } from '../types';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin?: number;
}

export class ApiClient {
  private baseUrl = '/api';
  private tokenKey = 'marketmind_auth_token';
  private userKey = 'marketmind_auth_user';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  setSession(token: string, user: UserSession, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.tokenKey, token);
    storage.setItem(this.userKey, JSON.stringify(user));
  }

  getStoredUser(): UserSession | null {
    const data = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
  }

  async login(email: string, password: string, remember = true): Promise<{ success: boolean; token?: string; user?: UserSession; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication failed' };
      }
      this.setSession(data.token, data.user, remember);
      return { success: true, token: data.token, user: data.user };
    } catch (e: any) {
      // Offline fallback verification against configured login if backend is unreachable
      if (email.trim().toLowerCase() === 'kabuirobah198@gmail.com' && password === 'P4vpxw@$') {
        const mockUser: UserSession = {
          id: 'admin_terminal_01',
          email: 'kabuirobah198@gmail.com',
          name: 'Kabui Robah',
          role: 'Senior Market Analyst & Terminal Admin',
          lastLogin: Date.now(),
        };
        const mockToken = btoa(`${email}_${Date.now()}`);
        this.setSession(mockToken, mockUser, remember);
        return { success: true, token: mockToken, user: mockUser };
      }
      return { success: false, error: e.message || 'Network error during login' };
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    this.clearSession();
  }

  async verifySession(): Promise<{ authenticated: boolean; user?: UserSession }> {
    const token = this.getToken();
    const cachedUser = this.getStoredUser();

    if (!token || !cachedUser) {
      return { authenticated: false };
    }

    try {
      const res = await fetch(`${this.baseUrl}/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          return { authenticated: true, user: data.user };
        }
      }
      // If server responded with error, return stored user if token is valid format
      return { authenticated: true, user: cachedUser };
    } catch {
      // Offline fallback: keep session if user data exists
      return { authenticated: true, user: cachedUser };
    }
  }

  async updateCredentials(currentPassword: string, newEmail?: string, newPassword?: string, newName?: string) {
    const token = this.getToken();
    const res = await fetch(`${this.baseUrl}/auth/update-credentials`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ currentPassword, newEmail, newPassword, newName }),
    });
    return res.json();
  }

  async checkHealth(): Promise<{ status: string; uptime: number; timestamp: number; capabilities: string[] }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }

  async getMarkets(): Promise<{ deriv: MarketAsset[]; mt5: MarketAsset[] }> {
    const res = await fetch(`${this.baseUrl}/markets`);
    if (!res.ok) throw new Error('Failed to fetch markets');
    return res.json();
  }

  async getStrategies(): Promise<{ total: number; strategies: any[] }> {
    const res = await fetch(`${this.baseUrl}/strategies`);
    if (!res.ok) throw new Error('Failed to fetch strategies');
    return res.json();
  }

  async getMarketSeed(marketId: string): Promise<{
    market: MarketAsset;
    candles: CandleData[];
    ticks: TickData[];
    digitStats: DigitStat[];
    smcOverlays: SmcOverlay[];
  }> {
    const res = await fetch(`${this.baseUrl}/markets/${encodeURIComponent(marketId)}/seed`);
    if (!res.ok) throw new Error('Failed to fetch market seed');
    return res.json();
  }

  async evaluateStrategies(payload: {
    asset: MarketAsset;
    candles: CandleData[];
    ticks: TickData[];
    digitStats: DigitStat[];
    lastTickDigit: number;
    last20Digits: number[];
    enabledStrategyIds?: string[];
  }): Promise<{
    success: boolean;
    scores: StrategyScore[];
    winningStrategy: StrategyScore | null;
    marketCondition: string;
  }> {
    const res = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to analyze strategies');
    return res.json();
  }

  async calculateDigits(ticks: TickData[], sampleSize?: number): Promise<{ success: boolean; stats: DigitStat[] }> {
    const res = await fetch(`${this.baseUrl}/calculate-digits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticks, sampleSize }),
    });
    if (!res.ok) throw new Error('Failed to calculate digits');
    return res.json();
  }

  async analyzeSmc(candles: CandleData[]): Promise<{ success: boolean; overlays: SmcOverlay[] }> {
    const res = await fetch(`${this.baseUrl}/smc-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candles }),
    });
    if (!res.ok) throw new Error('Failed to analyze SMC');
    return res.json();
  }
}

export const apiClient = new ApiClient();
