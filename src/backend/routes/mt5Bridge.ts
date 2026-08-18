import { Router, Request, Response } from 'express';
import { CandleData, TickData } from '../types';

export const mt5Router = Router();

interface MT5AccountPacket {
  accountNumber: string;
  server: string;
  balance: number;
  equity: number;
  currency: string;
  freeMargin: number;
  leverage: number;
  lastUpdated: number;
}

interface MT5SymbolState {
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  timestamp: number;
  spread: number;
  digits: number;
  recentTicks: TickData[];
  candles: CandleData[];
}

// In-memory MT5 state store
const activeAccounts = new Map<string, MT5AccountPacket>();
const symbolStates = new Map<string, MT5SymbolState>();
let lastTerminalPacketTime = 0;

// Initialize standard MT5 symbols
const DEFAULT_MT5_SYMBOLS = [
  { symbol: 'EURUSD', basePrice: 1.17420, digits: 5 },
  { symbol: 'GBPUSD', basePrice: 1.34820, digits: 5 },
  { symbol: 'USDJPY', basePrice: 154.650, digits: 3 },
  { symbol: 'XAUUSD', basePrice: 2685.40, digits: 2 },
  { symbol: 'US30', basePrice: 43250.0, digits: 1 },
  { symbol: 'US500', basePrice: 6025.40, digits: 2 },
  { symbol: 'BTCUSD', basePrice: 94250.0, digits: 2 },
];

DEFAULT_MT5_SYMBOLS.forEach(s => {
  symbolStates.set(s.symbol, {
    symbol: s.symbol,
    bid: s.basePrice - 0.0001,
    ask: s.basePrice + 0.0001,
    price: s.basePrice,
    timestamp: Date.now(),
    spread: 1.2,
    digits: s.digits,
    recentTicks: [],
    candles: [],
  });
});

// 1. Status & Health
mt5Router.get('/status', (_req: Request, res: Response) => {
  const isTerminalLive = Date.now() - lastTerminalPacketTime < 15000;
  const accounts = Array.from(activeAccounts.values());

  res.json({
    bridgeStatus: isTerminalLive ? 'online' : 'standby',
    isTerminalConnected: isTerminalLive,
    lastPacketReceived: lastTerminalPacketTime,
    latencyMs: isTerminalLive ? 12 : 0,
    connectedAccountsCount: accounts.length,
    accounts,
    trackedSymbolsCount: symbolStates.size,
    serverTime: Date.now(),
    bridgeEndpoint: '/api/mt5/push-tick',
  });
});

// 2. Receive Live Tick from MT5 Expert Advisor (EA) or Python Bridge
mt5Router.post('/push-tick', (req: Request, res: Response) => {
  try {
    const { symbol, price, bid, ask, spread, digits, timestamp, accountNumber, server } = req.body;

    if (!symbol || price === undefined) {
      return res.status(400).json({ error: 'Missing symbol or price in payload' });
    }

    const cleanSymbol = String(symbol).toUpperCase().replace(/[\/\-_]/g, '');
    lastTerminalPacketTime = Date.now();

    const finalDigits = typeof digits === 'number' ? digits : 2;
    const finalPrice = Number(price);
    const tickTime = timestamp ? Number(timestamp) : Date.now();

    const priceStr = finalPrice.toFixed(finalDigits);
    const lastDigit = parseInt(priceStr.slice(-1), 10) || 0;

    const newTick: TickData = {
      id: tickTime,
      timestamp: tickTime,
      price: finalPrice,
      lastDigit,
      direction: 'up',
    };

    let existing = symbolStates.get(cleanSymbol);
    if (!existing) {
      existing = {
        symbol: cleanSymbol,
        bid: bid !== undefined ? Number(bid) : finalPrice,
        ask: ask !== undefined ? Number(ask) : finalPrice,
        price: finalPrice,
        timestamp: tickTime,
        spread: spread !== undefined ? Number(spread) : 1,
        digits: finalDigits,
        recentTicks: [],
        candles: [],
      };
      symbolStates.set(cleanSymbol, existing);
    }

    // Update direction
    if (existing.recentTicks.length > 0) {
      const prevPrice = existing.recentTicks[existing.recentTicks.length - 1].price;
      newTick.direction = finalPrice > prevPrice ? 'up' : finalPrice < prevPrice ? 'down' : 'equal';
    }

    existing.price = finalPrice;
    existing.bid = bid !== undefined ? Number(bid) : finalPrice;
    existing.ask = ask !== undefined ? Number(ask) : finalPrice;
    existing.timestamp = tickTime;
    existing.recentTicks = [...existing.recentTicks.slice(-499), newTick];

    if (accountNumber && server) {
      activeAccounts.set(String(accountNumber), {
        accountNumber: String(accountNumber),
        server: String(server),
        balance: Number(req.body.balance || 0),
        equity: Number(req.body.equity || 0),
        currency: String(req.body.currency || 'USD'),
        freeMargin: Number(req.body.freeMargin || 0),
        leverage: Number(req.body.leverage || 100),
        lastUpdated: Date.now(),
      });
    }

    res.json({ success: true, symbol: cleanSymbol, timestamp: Date.now() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Receive Candles from MT5 EA
mt5Router.post('/push-candles', (req: Request, res: Response) => {
  try {
    const { symbol, candles } = req.body;
    if (!symbol || !Array.isArray(candles)) {
      return res.status(400).json({ error: 'Invalid payload: symbol and candles array required' });
    }

    const cleanSymbol = String(symbol).toUpperCase().replace(/[\/\-_]/g, '');
    let existing = symbolStates.get(cleanSymbol);
    if (existing) {
      existing.candles = candles.map((c: any) => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume || 100),
      }));
    }

    res.json({ success: true, count: candles.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Latest Market State for Symbol
mt5Router.get('/market/:symbol', (req: Request, res: Response) => {
  const cleanSymbol = String(req.params.symbol).toUpperCase().replace(/[\/\-_]/g, '');
  const state = symbolStates.get(cleanSymbol) || symbolStates.get('EURUSD');

  res.json({
    symbol: cleanSymbol,
    state,
    isTerminalConnected: Date.now() - lastTerminalPacketTime < 15000,
  });
});

// 5. Generate MQL5 Expert Advisor Script source code
mt5Router.get('/download/ea', (_req: Request, res: Response) => {
  const mql5Code = `//+------------------------------------------------------------------+
//|                                     MarketMindPro_Bridge.mq5     |
//|                        Copyright 2026, MarketMindPro Systems     |
//|                                    https://marketmindpro.local   |
//+------------------------------------------------------------------+
#property copyright "MarketMindPro Systems"
#property link      "https://marketmindpro.local"
#property version   "1.00"
#property strict

input string WebhookURL = "http://localhost:3000/api/mt5/push-tick"; // MarketMindPro Bridge URL
input int    TimerIntervalMs = 500; // Push frequency (ms)

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("MarketMindPro Bridge Initialized for symbol: ", _Symbol);
   EventSetMillisecondTimer(TimerIntervalMs);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Expert timer function                                            |
//+------------------------------------------------------------------+
void OnTimer()
{
   MqlTick lastTick;
   if(!SymbolInfoTick(_Symbol, lastTick)) return;

   string payload = StringFormat(
      "{\\"symbol\\":\\"%s\\",\\"price\\":%.5f,\\"bid\\":%.5f,\\"ask\\":%.5f,\\"digits\\":%d,\\"timestamp\\":%I64d,\\"accountNumber\\":\\"%d\\",\\"server\\":\\"%s\\",\\"balance\\":%.2f,\\"equity\\":%.2f}",
      _Symbol,
      lastTick.bid,
      lastTick.bid,
      lastTick.ask,
      _Digits,
      (long)lastTick.time_msc,
      AccountInfoInteger(ACCOUNT_LOGIN),
      AccountInfoString(ACCOUNT_SERVER),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY)
   );

   char postData[];
   char result[];
   string resultHeaders;
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);

   string headers = "Content-Type: application/json\\r\\n";
   int res = WebRequest("POST", WebhookURL, headers, 1000, postData, result, resultHeaders);
   if(res == -1)
   {
      // Tip: Add WebhookURL to MT5 -> Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL
   }
}
//+------------------------------------------------------------------+
`;

  res.setHeader('Content-Disposition', 'attachment; filename="MarketMindPro_Bridge.mq5"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(mql5Code);
});

// 6. Generate Python Bridge script
mt5Router.get('/download/python-bridge', (_req: Request, res: Response) => {
  const pythonCode = `"""
MarketMindPro MetaTrader 5 High-Frequency Bridge
Pushes live tick quotes & account balance from local MT5 terminal to MarketMindPro
Requirements: pip install MetaTrader5 requests
"""
import time
import requests
import MetaTrader5 as mt5

SERVER_URL = "http://localhost:3000/api/mt5/push-tick"
SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "US30", "BTCUSD"]

def main():
    if not mt5.initialize():
        print("[!] Failed to initialize MetaTrader 5, error code =", mt5.last_error())
        return

    print("[✓] Connected to MetaTrader 5 Terminal successfully")
    acc = mt5.account_info()
    if acc:
        print(f"[✓] Account: {acc.login} | Server: {acc.server} | Balance: {acc.balance} {acc.currency}")

    for s in SYMBOLS:
        mt5.symbol_select(s, True)

    while True:
        try:
            for symbol in SYMBOLS:
                tick = mt5.symbol_info_tick(symbol)
                info = mt5.symbol_info(symbol)
                if tick and info:
                    payload = {
                        "symbol": symbol,
                        "price": tick.bid,
                        "bid": tick.bid,
                        "ask": tick.ask,
                        "digits": info.digits,
                        "timestamp": int(tick.time_msc),
                        "accountNumber": str(acc.login if acc else "MT5-USER"),
                        "server": str(acc.server if acc else "MetaQuotes-Demo"),
                        "balance": float(acc.balance if acc else 10000.0),
                        "equity": float(acc.equity if acc else 10000.0),
                    }
                    requests.post(SERVER_URL, json=payload, timeout=0.3)
            time.sleep(0.5)
        except KeyboardInterrupt:
            break
        except Exception as e:
            time.sleep(1)

    mt5.shutdown()

if __name__ == "__main__":
    main()
`;

  res.setHeader('Content-Disposition', 'attachment; filename="mt5_bridge.py"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(pythonCode);
});
