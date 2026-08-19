import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CandleData, TickData } from '../types';

export const mt5Router = Router();

export interface MT5AccountPacket {
  accountNumber: string;
  server: string;
  balance: number;
  equity: number;
  currency: string;
  freeMargin: number;
  leverage: number;
  lastUpdated: number;
}

export interface MT5SymbolState {
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

export interface MT5WebhookSignal {
  id: string;
  timestamp: number;
  action: 'BUY' | 'SELL' | 'CLOSE' | 'CLOSEALL';
  symbol: string;
  lot: number;
  sl: number; // in pips
  tp: number; // in pips
  comment: string;
  status: 'PENDING' | 'DISPATCHED' | 'EXECUTED';
  rawPipeDelimited: string;
}

// In-memory MT5 state store
const activeAccounts = new Map<string, MT5AccountPacket>();
const symbolStates = new Map<string, MT5SymbolState>();
const signalHistory: MT5WebhookSignal[] = [];
let lastTerminalPacketTime = 0;

// Configuration
let configuredWebhookSecret = process.env.WEBHOOK_SECRET || 'mmp_mt5_secret_2026';
let configuredSignalFilePath = process.env.SIGNAL_FILE_PATH || '';

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

// Helper: Write signal to MT5 shared Common\Files if file path is available
function writeSignalToFile(pipeLine: string) {
  if (!configuredSignalFilePath) {
    // Default fallback in project if no absolute path
    const fallbackDir = path.join(process.cwd(), 'signals');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      fs.appendFileSync(path.join(fallbackDir, 'tv_signal.txt'), pipeLine + '\n', 'utf8');
    } catch {}
    return;
  }

  try {
    const dir = path.dirname(configuredSignalFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(configuredSignalFilePath, pipeLine + '\n', 'utf8');
  } catch (e) {
    console.error('Error writing signal to SIGNAL_FILE_PATH:', e);
  }
}

// 1. Status & Health
mt5Router.get('/status', (_req: Request, res: Response) => {
  const isTerminalLive = Date.now() - lastTerminalPacketTime < 25000;
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
    webhookEndpoint: '/api/mt5/webhook',
    webhookSecret: configuredWebhookSecret,
    signalFilePath: configuredSignalFilePath,
    signalsCount: signalHistory.length,
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

// 4. Ingest Webhook Signal (from TradingView or MarketMindPro)
export const handleWebhookSignal = (req: Request, res: Response) => {
  try {
    const { secret, action, symbol, lot, sl, tp, comment } = req.body;

    // Check secret
    if (secret && configuredWebhookSecret && secret !== configuredWebhookSecret) {
      return res.status(403).json({ error: 'Invalid webhook secret. Request rejected.' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Missing "action" in alert payload (buy, sell, close, closeall)' });
    }

    const cleanAction = String(action).toUpperCase() as 'BUY' | 'SELL' | 'CLOSE' | 'CLOSEALL';
    if (!['BUY', 'SELL', 'CLOSE', 'CLOSEALL'].includes(cleanAction)) {
      return res.status(400).json({ error: `Invalid action "${action}". Allowed: buy, sell, close, closeall` });
    }

    const cleanSymbol = symbol ? String(symbol).toUpperCase().replace(/[\/\-_]/g, '') : 'EURUSD';
    const numLot = typeof lot === 'number' && lot > 0 ? lot : 0.1;
    const numSl = typeof sl === 'number' ? sl : 0;
    const numTp = typeof tp === 'number' ? tp : 0;
    const cleanComment = comment ? String(comment).replace(/[\|\r\n]/g, '_') : 'mmp-bridge';
    const timestamp = Date.now();

    // Pipe-delimited string for MT5 EA: ACTION|SYMBOL|LOT|SL|TP|COMMENT|TIMESTAMP
    const pipeLine = `${cleanAction}|${cleanSymbol}|${numLot.toFixed(2)}|${numSl}|${numTp}|${cleanComment}|${timestamp}`;

    const signalItem: MT5WebhookSignal = {
      id: `sig_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      action: cleanAction,
      symbol: cleanSymbol,
      lot: numLot,
      sl: numSl,
      tp: numTp,
      comment: cleanComment,
      status: 'DISPATCHED',
      rawPipeDelimited: pipeLine,
    };

    // Store in signal history (limit 200)
    signalHistory.unshift(signalItem);
    if (signalHistory.length > 200) signalHistory.pop();

    // Write to common file
    writeSignalToFile(pipeLine);

    return res.json({
      success: true,
      message: 'Signal accepted and dispatched to MT5 Bridge',
      signal: signalItem,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error processing webhook signal' });
  }
};

mt5Router.post('/webhook', handleWebhookSignal);

// 5. Get Signal History & Queue for UI
mt5Router.get('/signals', (_req: Request, res: Response) => {
  res.json({
    signals: signalHistory,
    total: signalHistory.length,
    webhookSecret: configuredWebhookSecret,
    signalFilePath: configuredSignalFilePath,
  });
});

// 6. Update Webhook Config
mt5Router.post('/config', (req: Request, res: Response) => {
  const { webhookSecret, signalFilePath } = req.body;
  if (typeof webhookSecret === 'string') configuredWebhookSecret = webhookSecret;
  if (typeof signalFilePath === 'string') configuredSignalFilePath = signalFilePath;

  res.json({
    success: true,
    webhookSecret: configuredWebhookSecret,
    signalFilePath: configuredSignalFilePath,
  });
});

// 7. Test Signal Generator Endpoint
mt5Router.post('/test-signal', (req: Request, res: Response) => {
  req.body.secret = configuredWebhookSecret;
  return handleWebhookSignal(req, res);
});

// 8. Poll Signal for WebRequest MT5 EAs
mt5Router.get('/poll-signal', (req: Request, res: Response) => {
  const secret = req.query.secret;
  if (secret && configuredWebhookSecret && secret !== configuredWebhookSecret) {
    return res.status(403).send('FORBIDDEN');
  }

  const latest = signalHistory[0];
  if (latest && latest.status === 'DISPATCHED' && Date.now() - latest.timestamp < 10000) {
    latest.status = 'EXECUTED';
    return res.send(latest.rawPipeDelimited);
  }

  return res.send('EMPTY');
});

// 9. Get Market State for Symbol
mt5Router.get('/market/:symbol', (req: Request, res: Response) => {
  const cleanSymbol = String(req.params.symbol).toUpperCase().replace(/[\/\-_]/g, '');
  const state = symbolStates.get(cleanSymbol) || symbolStates.get('EURUSD');

  res.json({
    symbol: cleanSymbol,
    state,
    isTerminalConnected: Date.now() - lastTerminalPacketTime < 25000,
  });
});

// 10. Generate TV_Bridge_EA.mq5 Expert Advisor source code
const getMql5SourceCode = () => `//+------------------------------------------------------------------+
//|                                              TV_Bridge_EA.mq5    |
//|                        Copyright 2026, MarketMindPro Systems     |
//|                    TradingView / MarketMindPro -> MT5 Bridge     |
//+------------------------------------------------------------------+
#property copyright "MarketMindPro Systems"
#property link      "https://marketmindpro.trade"
#property version   "1.00"
#property strict

#include <Trade\\Trade.mqh>
#include <Trade\\SymbolInfo.mqh>

//--- Inputs
input string   SignalFileName            = "tv_signal.txt"; // Signal file in Common\\Files
input double   MaxLotSize                = 1.0;             // Max allowed lot size (safety cap)
input string   AllowedSymbols            = "";              // Whitelist (e.g. EURUSD,GBPUSD, leave empty for all)
input int      SlippagePoints            = 30;              // Max slippage in points
input ulong    MagicNumber               = 108924;          // EA Magic Number
input int      CheckIntervalMs           = 1000;            // Poll interval (ms)
input int      PipMultiplier             = 10;              // 10 for 5/3 digit brokers, 1 for 4/2 digit
input bool     DeleteSignalAfterExecute  = true;            // Clear signal file after execution

//--- Global Objects
CTrade         m_trade;
CSymbolInfo    m_symbol;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   m_trade.SetExpertMagicNumber(MagicNumber);
   m_trade.SetDeviationInPoints(SlippagePoints);
   m_trade.SetTypeFilling(ORDER_FILLING_FOK);
   
   Print("=================================================");
   Print("TV_Bridge_EA initialized successfully.");
   Print("Watching Common\\\\Files\\\\", SignalFileName, " every ", CheckIntervalMs, "ms");
   Print("Magic Number: ", MagicNumber, " | Max Lot Size: ", MaxLotSize);
   Print("=================================================");

   EventSetMillisecondTimer(CheckIntervalMs);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("TV_Bridge_EA stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Check if symbol is allowed                                       |
//+------------------------------------------------------------------+
bool IsSymbolAllowed(string symbol)
{
   if(StringLen(AllowedSymbols) == 0) return true;
   string allowed[];
   int count = StringSplit(AllowedSymbols, ',', allowed);
   for(int i = 0; i < count; i++)
   {
      string s = allowed[i];
      StringTrimLeft(s);
      StringTrimRight(s);
      StringToUpper(s);
      if(s == symbol) return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Close positions for a specific symbol                            |
//+------------------------------------------------------------------+
void ClosePositionsForSymbol(string symbol)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(PositionGetString(POSITION_SYMBOL) == symbol && 
            PositionGetInteger(POSITION_MAGIC) == MagicNumber)
         {
            m_trade.PositionClose(ticket);
            Print("Closed position #", ticket, " for ", symbol);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Close all positions opened by this EA                            |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(PositionGetInteger(POSITION_MAGIC) == MagicNumber)
         {
            m_trade.PositionClose(ticket);
            Print("Closed position #", ticket);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Execute Parsed Signal                                            |
//+------------------------------------------------------------------+
void ProcessSignalLine(string line)
{
   StringTrimLeft(line);
   StringTrimRight(line);
   if(StringLen(line) == 0) return;

   // Expected format: ACTION|SYMBOL|LOT|SL|TP|COMMENT|TIMESTAMP
   string parts[];
   int count = StringSplit(line, '|', parts);
   if(count < 2)
   {
      Print("Invalid signal line format: ", line);
      return;
   }

   string action = parts[0];
   StringToUpper(action);

   if(action == "CLOSEALL")
   {
      Print("[TV_Bridge_EA] Received CLOSEALL signal");
      CloseAllPositions();
      return;
   }

   string symbol = parts[1];
   StringToUpper(symbol);

   if(!IsSymbolAllowed(symbol))
   {
      Print("[TV_Bridge_EA] Symbol ", symbol, " is not in AllowedSymbols whitelist. Ignoring.");
      return;
   }

   if(action == "CLOSE")
   {
      Print("[TV_Bridge_EA] Received CLOSE signal for ", symbol);
      ClosePositionsForSymbol(symbol);
      return;
   }

   double lot = (count > 2) ? StringToDouble(parts[2]) : 0.1;
   double slPips = (count > 3) ? StringToDouble(parts[3]) : 0;
   double tpPips = (count > 4) ? StringToDouble(parts[4]) : 0;
   string comment = (count > 5) ? parts[5] : "TV_Bridge";

   if(lot > MaxLotSize)
   {
      Print("[TV_Bridge_EA] Requested lot ", lot, " exceeds MaxLotSize ", MaxLotSize, ". Ignoring signal.");
      return;
   }

   if(!m_symbol.Name(symbol))
   {
      Print("[TV_Bridge_EA] Failed to select symbol: ", symbol);
      return;
   }
   m_symbol.RefreshRates();

   double point = m_symbol.Point();
   int digits = (int)m_symbol.Digits();
   double ask = m_symbol.Ask();
   double bid = m_symbol.Bid();

   if(action == "BUY")
   {
      double slPrice = (slPips > 0) ? NormalizeDouble(ask - (slPips * point * PipMultiplier), digits) : 0;
      double tpPrice = (tpPips > 0) ? NormalizeDouble(ask + (tpPips * point * PipMultiplier), digits) : 0;

      Print("[TV_Bridge_EA] Executing BUY ", lot, " ", symbol, " @ ", ask, " SL: ", slPrice, " TP: ", tpPrice);
      if(m_trade.Buy(lot, symbol, ask, slPrice, tpPrice, comment))
      {
         Print("[TV_Bridge_EA] BUY Executed Successfully. Ticket: ", m_trade.ResultOrder());
      }
      else
      {
         Print("[TV_Bridge_EA] BUY Execution Failed. Error: ", m_trade.ResultRetcodeDescription());
      }
   }
   else if(action == "SELL")
   {
      double slPrice = (slPips > 0) ? NormalizeDouble(bid + (slPips * point * PipMultiplier), digits) : 0;
      double tpPrice = (tpPips > 0) ? NormalizeDouble(bid - (tpPips * point * PipMultiplier), digits) : 0;

      Print("[TV_Bridge_EA] Executing SELL ", lot, " ", symbol, " @ ", bid, " SL: ", slPrice, " TP: ", tpPrice);
      if(m_trade.Sell(lot, symbol, bid, slPrice, tpPrice, comment))
      {
         Print("[TV_Bridge_EA] SELL Executed Successfully. Ticket: ", m_trade.ResultOrder());
      }
      else
      {
         Print("[TV_Bridge_EA] SELL Execution Failed. Error: ", m_trade.ResultRetcodeDescription());
      }
   }
}

//+------------------------------------------------------------------+
//| Timer function: Polls Common\\Files for new signals               |
//+------------------------------------------------------------------+
void OnTimer()
{
   int fileHandle = FileOpen(SignalFileName, FILE_READ | FILE_TXT | FILE_COMMON | FILE_SHARE_READ | FILE_SHARE_WRITE);
   if(fileHandle == INVALID_HANDLE)
   {
      return; // No file or busy
   }

   string lines[];
   int lineCount = 0;
   while(!FileIsEnding(fileHandle))
   {
      string line = FileReadString(fileHandle);
      if(StringLen(line) > 0)
      {
         ArrayResize(lines, lineCount + 1);
         lines[lineCount] = line;
         lineCount++;
      }
   }
   FileClose(fileHandle);

   if(lineCount > 0)
   {
      for(int i = 0; i < lineCount; i++)
      {
         ProcessSignalLine(lines[i]);
      }

      if(DeleteSignalAfterExecute)
      {
         int delHandle = FileOpen(SignalFileName, FILE_WRITE | FILE_TXT | FILE_COMMON);
         if(delHandle != INVALID_HANDLE)
         {
            FileWriteString(delHandle, "");
            FileClose(delHandle);
         }
      }
   }
}
`;

mt5Router.get('/download/ea', (_req: Request, res: Response) => {
  res.setHeader('Content-Disposition', 'attachment; filename="TV_Bridge_EA.mq5"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(getMql5SourceCode());
});

mt5Router.get('/download/tv-bridge-ea', (_req: Request, res: Response) => {
  res.setHeader('Content-Disposition', 'attachment; filename="TV_Bridge_EA.mq5"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(getMql5SourceCode());
});

// 11. Generate Python Bridge script
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

