const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER HTTP SUNUCUSU ---
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('AFK Bot Aktif ve Çalışıyor!');
});

app.listen(PORT, () => {
  console.log(`Web sunucusu ${PORT} portunda başlatıldı.`);
});

// --- 2. BOT VE HESAP AYARLARI ---
const CONFIG = {
  host: 'reborncraft.pw',       
  port: 25565,
  username: 'xBetray_31_AFK',   
  password: 'efe43802',         
  version: '1.21.6' // Skyblock alt sunucusunun zorunlu kıldığı minimum sürüm
};

let bot;
let isLoggedIn = false;
let isSkyblockSent = false;

function createBot() {
  console.log(`${CONFIG.username} adıyla bota bağlanılıyor...`);
  isLoggedIn = false;
  isSkyblockSent = false;
  
  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    viewDistance: 'tiny',
    checkTimeoutInterval: 30000,
    hideErrors: true
  });

  // --- PARÇACIK (PARTICLE) PROTOKOL HATALARINI YUTMA ---
  bot._client.on('error', (err) => {
    if (err && (err.name === 'PartialReadError' || (err.message && err.message.includes('Particle')))) {
      return; // Protodef paket uyuşmazlığı hatalarını konsola yazma
    }
  });

  // --- OYUNA GİRİŞ AKIŞI ---
  bot.on('spawn', () => {
    console.log('>>> SUNUCUYA/BOYUTA GİRİŞ YAPILDI <<<');
    
    if (!isLoggedIn) {
      isLoggedIn = true;
      setTimeout(() => {
        bot.chat(`/login ${CONFIG.password}`);
        console.log('Giriş komutu (/login) gönderildi.');
      }, 2000);
    }
  });

  // --- CHAT DİNLEME VE OTOMATİK AKIŞ ---
  bot.on('messagestr', (message) => {
    console.log(`[CHAT] ${message}`);
    const msg = message.toLowerCase();

    // Giriş başarılı uyarısı geldiğinde 1 defa /skyblock at
    if ((msg.includes('giriş başarılı') || msg.includes('zaten giriş yaptın')) && !isSkyblockSent) {
      isSkyblockSent = true;
      setTimeout(() => {
        bot.chat('/skyblock');
        console.log('Skyblock sunucusuna geçiş komutu (/skyblock) gönderildi.');
      }, 3000);
    }

    // Skyblock sunucusuna aktarıldığında adaya ışınlan
    if (msg.includes('rebornsky') || msg.includes('ada') || msg.includes('hoş geldiniz')) {
      setTimeout(() => {
        bot.chat('/home');
        console.log('Adaya ışınlanma (/home) gönderildi.');
      }, 3000);
    }
  });

  // Her 3 dakikada bir adada kalmayı garantiye almak için /home atar
  setInterval(() => {
    if (bot && bot.entity && isSkyblockSent) {
      bot.chat('/home');
      console.log('Periyodik adaya dönme (/home) gönderildi.');
    }
  }, 3 * 60 * 1000);

  // --- MİNYON BULMA VE ONA BAKARAK TIKLAMA ---
  setInterval(async () => {
    if (!bot || !bot.entity) return;

    const minion = bot.nearestEntity(e => 
      (e.type === 'object' || e.type === 'mob' || e.type === 'player' || e.name === 'armor_stand') &&
      e.id !== bot.entity.id
    );

    if (minion && bot.entity.position.distanceTo(minion.position) < 4) {
      try {
        const targetPos = minion.position.offset(0, 1, 0);
        await bot.lookAt(targetPos);
        
        bot.swingArm('right');
        bot.activateEntity(minion);
      } catch (err) {
        // Tıklama hatalarını sessizce geç
      }
    }
  }, 15000);

  // --- AÇILAN ARAYÜZ (GUI) İŞLEMLERİ ---
  bot.on('windowOpen', async (window) => {
    console.log(`>>> MENÜ AÇILDI: ${window.title} <<<`);

    const GOLDEN_APPLE_SLOT = 36; // Altın Elma Slotu (5. satır 1. sütun)

    setTimeout(async () => {
      try {
        await bot.clickWindow(GOLDEN_APPLE_SLOT, 0, 0);
        console.log('Minyon besleme butonuna (Altın Elma - Slot 36) tıklandı!');
        
        setTimeout(() => {
          bot.closeWindow(window);
        }, 1000);
      } catch (err) {
        console.log('Arayüz tıklama hatası:', err.message);
      }
    }, 1200);
  });

  // Hata ve Atılma Yönetimi
  bot.on('kicked', (reason) => {
    console.log('!!! BOT SUNUCUDAN ATILDI !!!');
    console.log('Atılma Sebebi:', JSON.stringify(reason));
  });

  bot.on('error', (err) => {
    if (err && (err.name === 'PartialReadError' || (err.message && err.message.includes('Particle')))) return;
    console.log('!!! BOT HATA ALDI !!!', err.message);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu. 15 saniye sonra tekrar bağlanılacak...');
    setTimeout(createBot, 15000);
  });
}

createBot();
