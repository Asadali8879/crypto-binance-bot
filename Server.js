// server/server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const INTERVAL_MS = 10*60*1000; // 10 min

// Helper: fetch latest 10M candle from Binance
async function getCandle(symbol){
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=10m&limit=2`);
  const data = await res.json();
  const lastCandle = data[1]; // previous complete candle
  return {
    open: parseFloat(lastCandle[1]),
    close: parseFloat(lastCandle[4]),
    high: parseFloat(lastCandle[2]),
    low: parseFloat(lastCandle[3]),
    time: lastCandle[0]
  }
}

// Determine signal using RSI-like logic
function getSignal(c1,c2){
  const rsi = Math.random()*100; // placeholder
  if(c1.close<c1.open && c2.close>c2.open && rsi<35) return 'BUY';
  if(c1.close>c1.open && c2.close<c2.open && rsi>65) return 'SELL';
  return 'WAIT';
}

async function fetchSignals(){
  const btc1 = await getCandle('BTCUSDT');
  const btc2 = await getCandle('BTCUSDT');
  const eth1 = await getCandle('ETHUSDT');
  const eth2 = await getCandle('ETHUSDT');

  const btcSignal = getSignal(btc1,btc2);
  const ethSignal = getSignal(eth1,eth2);

  // send to telegram
  if(btcSignal!=='WAIT'){
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text:`BTCUSDT | 10M\nSignal: ${btcSignal}`})
    });
  }
  if(ethSignal!=='WAIT'){
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text:`ETHUSDT | 10M\nSignal: ${ethSignal}`})
    });
  }

  return {
    BTC: {...btc2, price: btc2.close, signal: btcSignal, rsi: Math.floor(Math.random()*100)},
    ETH: {...eth2, price: eth2.close, signal: ethSignal, rsi: Math.floor(Math.random()*100)},
    nextCandle: Date.now() + INTERVAL_MS
  }
}

app.get('/signals', async(req,res)=>{
  const data = await fetchSignals();
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
