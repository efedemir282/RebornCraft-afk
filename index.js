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
  username: 'xBetray_31_AFK',   // Kullanıcı adın tanımlı
  password: 'efe43802',         // Şifren tanımlı
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

  // --- OYUNA GİRİŞ VE ADA YÖNLENDİRMESİ ---
  bot.on('spawn', () => {
    console.log('Bot sunucuya/lobiye bağlandı.');
    
    // 1. Adım: Giriş yap
    setTimeout(() => {
      bot.chat(`/login ${CONFIG.password}`);
      console.log('Giriş komutu (/login) gönderildi.');
    }, 2000);

    // 2. Adım: Giriş işleminin tamamlanmasını bekleyip adaya git
    setTimeout(() => {
      bot.chat('/home');
      console.log('Adaya ışınlanma komutu (/home) gönderildi.');
    }, 7000);
  });

  // Her 3 dakikada bir adada kalmayı garantiye almak için /home atar
  setInterval(() => {
    if (bot && bot.entity) {
      bot.chat('/home');
      console.log('Periyodik adaya dönme (/home) gönderildi.');
    }
  }, 3 * 60 * 1000);

  // --- CHAT DİNLEME VE OTOMATİK TEPKİLER ---
  bot.on('messagestr', (message) => {
    console.log(`[CHAT] ${message}`);
    const msg = message.toLowerCase();

    // Şifre girme uyarısı çıkarsa tekrar login at
    if (msg.includes('/login') || msg.includes('sifre') || msg.includes('şifre')) {
      setTimeout(() => {
        bot.chat(`/login ${CONFIG.password}`);
      }, 1000);
    }

    // Giriş başarılı olunca veya lobiye atılınca /home çek
    if (
      msg.includes('basari') || 
      msg.includes('başarı') || 
      msg.includes('hos geldin') || 
      msg.includes('hoş geldin') || 
      msg.includes('lobide') || 
      msg.includes('spawn') || 
      msg.includes('düştünüz')
    ) {
      setTimeout(() => {
        bot.chat('/home');
        console.log('Chat uyarısı üzerine /home atıldı.');
      }, 3000);
    }
  });

  // --- MİNYON BULMA VE ONA BAKARAK TIKLAMA ---
  setInterval(async () => {
    if (!bot || !bot.entity) return;

    // Yakındaki minyon / armor stand varlığını bul (kendisi hariç)
    const minion = bot.nearestEntity(e => 
      (e.type === 'object' || e.type === 'mob' || e.type === 'player' || e.name === 'armor_stand') &&
      e.id !== bot.entity.id
    );

    if (minion && bot.entity.position.distanceTo(minion.position) < 4) {
      try {
        // Kafayı minyona çevir ve tıklama yap
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

    const GOLDEN_APPLE_SLOT = 36; // Altın Elma Slotu (Görseldeki 5. satır 1. sütun)

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
