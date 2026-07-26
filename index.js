const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER HTTP SUNUCUSU ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('AFK Bot Aktif ve Çalışıyor!');
});

app.listen(PORT, () => {
  console.log(`Web sunucusu ${PORT} portunda başlatıldı.`);
});

// --- 2. BOT AYARLARI ---
const CONFIG = {
  host: 'reborncraft.pw',       
  port: 25565,
  username: 'xBetray_31_AFK',   
  password: 'efe43802',         
  version: '1.21.1'
};

let bot;

function createBot() {
  console.log(`${CONFIG.username} adıyla bota bağlanılıyor...`);
  
  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    checkTimeoutInterval: 30000,
    hideErrors: false
  });

  bot.on('spawn', () => {
    console.log('>>> SUNUCUYA BAŞARIYLA GİRİŞ YAPILDI <<<');
    
    setTimeout(() => {
      bot.chat(`/login ${CONFIG.password}`);
      console.log('Giriş komutu (/login) gönderildi.');
    }, 2000);

    setTimeout(() => {
      bot.chat('/home');
      console.log('Adaya ışınlanma komutu (/home) gönderildi.');
    }, 7000);
  });

  bot.on('messagestr', (message) => {
    console.log(`[CHAT] ${message}`);
  });

  // Hata ve Atılma Sebeplerini Açıkça Yazdır
  bot.on('kicked', (reason) => {
    console.log('!!! BOT SUNUCUDAN ATILDI !!!');
    console.log('Atılma Sebebi:', JSON.stringify(reason));
  });

  bot.on('error', (err) => {
    console.log('!!! BOT HATA ALDI !!!');
    console.log('Hata Detayı:', err.message);
  });

  bot.on('end', (reason) => {
    console.log(`Bağlantı koptu/sonlandı. Sebep/Kod: ${reason}`);
    console.log('10 saniye sonra tekrar bağlanılacak...');
    setTimeout(createBot, 10000);
  });
}

createBot();
