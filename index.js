const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER İÇİN HTTP SUNUCUSU ---
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

function createBot() {
  console.log(`${CONFIG.username} adıyla bota bağlanılıyor...`);
  
  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version
  });

  // --- OYUNA GİRİŞ VE SÜREKLİ ADA KONTROLÜ ---
  bot.on('spawn', () => {
    console.log('Bot oyuna giriş yaptı!');
    
    // Otomatik Giriş Yapma
    setTimeout(() => {
      bot.chat(`/login ${CONFIG.password}`);
      console.log('Giriş komutu (/login) gönderildi.');
    }, 2000);

    // Giriş yaptıktan sonra adaya git
    setTimeout(() => {
      bot.chat('/home');
      console.log('Adaya ışınlanılıyor (/home)...');
    }, 5000);
  });

  // Her 3 dakikada bir adada kalmayı garantiye almak için /home atar
  setInterval(() => {
    if (bot && bot.entity) {
      bot.chat('/home');
      console.log('Adaya dönme komutu (/home) gönderildi.');
    }
  }, 3 * 60 * 1000);

  // --- MİNYON BULMA VE TIKLAMA ---
  setInterval(() => {
    if (!bot || !bot.entity) return;

    // Yakındaki minyon / armor stand varlığını bul
    const minion = bot.nearestEntity(e => 
      e.type === 'object' || 
      e.type === 'mob' || 
      e.type === 'player' || 
      e.name === 'armor_stand'
    );

    if (minion && bot.entity.position.distanceTo(minion.position) < 4) {
      console.log('Minyona sağ tık yapılıyor...');
      bot.activateEntity(minion);
    }
  }, 15000); // 15 saniyede bir minyona basar

  // --- AÇILAN ARAYÜZ (GUI) İŞLEMLERİ ---
  bot.on('windowOpen', async (window) => {
    console.log(`Arayüz açıldı: ${window.title}`);

    // Görseldeki Altın Elma Slotu (Slot 36)
    const GOLDEN_APPLE_SLOT = 36;

    setTimeout(async () => {
      try {
        await bot.clickWindow(GOLDEN_APPLE_SLOT, 0, 0);
        console.log('Minyon besleme butonuna (Altın Elma - Slot 36) tıklandı!');
        
        // Menüyü kapat
        setTimeout(() => {
          bot.closeWindow(window);
        }, 1000);
      } catch (err) {
        console.log('Arayüz tıklama hatası:', err.message);
      }
    }, 1200);
  });

  // --- CHAT DİNLEME (DÜŞME / LOBİ DURUMLARI) ---
  bot.on('messagestr', (message) => {
    console.log(`[CHAT] ${message}`);

    const triggerWords = ['lobide', 'spawn', 'düştünüz', 'aktarıldınız', 'yeniden'];
    if (triggerWords.some(word => message.toLowerCase().includes(word))) {
      setTimeout(() => {
        bot.chat('/home');
      }, 3000);
    }
  });

  // --- BAĞLANTI KOPMA VE YENİDEN BAĞLANMA ---
  bot.on('kick', (reason) => {
    console.log('Bot atıldı, sebep:', reason);
  });

  bot.on('error', (err) => {
    console.log('Bot hatası:', err);
  });

  bot.on('end', () => {
    console.log('Bağlantı kesildi. 10 saniye sonra tekrar bağlanılacak...');
    setTimeout(createBot, 10000);
  });
}

createBot();
