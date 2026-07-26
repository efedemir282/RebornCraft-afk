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

// --- 2. BOT VE HESAP AYARLARI ---
const CONFIG = {
  host: 'reborncraft.pw',       
  port: 25565,
  username: 'xBetray_31_AFK',   
  password: 'efe43802',         
  version: '1.21.1'
};

let bot;
let isLoggedIn = false;

function createBot() {
  console.log(`${CONFIG.username} adıyla bota bağlanılıyor...`);
  isLoggedIn = false;
  
  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    checkTimeoutInterval: 30000,
    hideErrors: false
  });

  // --- OYUNA GİRİŞ VE LOBİ AKIŞI ---
  bot.on('spawn', () => {
    console.log('>>> SUNUCUYA/BOYUTA GİRİŞ YAPILDI <<<');
    
    // Henüz login olunmadıysa giriş yap
    if (!isLoggedIn) {
      setTimeout(() => {
        bot.chat(`/login ${CONFIG.password}`);
        console.log('Giriş komutu (/login) gönderildi.');
      }, 2000);
    }
  });

  // --- CHAT DİNLEME VE OTOMATİK ADIMLAR ---
  bot.on('messagestr', (message) => {
    console.log(`[CHAT] ${message}`);
    const msg = message.toLowerCase();

    // 1. Adım: Giriş başarılı uyarısı geldiğinde Skyblock'a geç
    if (msg.includes('giriş başarılı') || msg.includes('aktarılıyorsunuz')) {
      isLoggedIn = true;
      setTimeout(() => {
        bot.chat('/skyblock');
        console.log('Skyblock sunucusuna geçiş komutu (/skyblock) gönderildi.');
      }, 3000);
    }

    // 2. Adım: Lobide kalındıysa veya uyara çıkarsa tekrar /skyblock at
    if (msg.includes('sadece belirli olan komutları') || msg.includes('/skyblock')) {
      setTimeout(() => {
        bot.chat('/skyblock');
        console.log('Lobide kalındı, tekrar /skyblock gönderildi.');
      }, 2000);
    }

    // 3. Adım: Skyblock sunucusuna girince veya 3 dakikada bir adaya ışınlan
    if (msg.includes('rebornsky') || msg.includes('ada') || msg.includes('hoş geldiniz')) {
      setTimeout(() => {
        bot.chat('/home');
        console.log('Adaya ışınlanma (/home) gönderildi.');
      }, 3000);
    }
  });

  // Her 3 dakikada bir adaya dönmeyi garantiye al
  setInterval(() => {
    if (bot && bot.entity && isLoggedIn) {
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
        console.log('Minyona tıklama hatası:', err.message);
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
    console.log('!!! BOT HATA ALDI !!!');
    console.log('Hata Detayı:', err.message);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu. 15 saniye sonra tekrar bağlanılacak...');
    setTimeout(createBot, 15000);
  });
}

createBot();
