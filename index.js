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
  version: '1.21.6'
};

let bot = null;
let activeIntervals = [];

// Eski bağlantılardan kalan zamanlayıcıları temizleme fonksiyonu
function clearAllIntervals() {
  activeIntervals.forEach(clearInterval);
  activeIntervals = [];
}

function createBot() {
  clearAllIntervals(); // Yeniden bağlanırken eski tüm zamanlayıcıları yok et
  console.log(`${CONFIG.username} adıyla bota bağlanılıyor...`);
  
  let isLoggedIn = false;
  let isSkyblockSent = false;
  let inSkyblock = false;

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    viewDistance: 4,
    checkTimeoutInterval: 30000,
    hideErrors: true
  });

  // --- FASTDECODER ENGELEME (SOKET / QUEUE & WRITE HOOK) ---
  if (bot._client) {
    // 1. Queue Seviyesinde Engelleme (Mineflayer otomatik sunucu geçiş paketi)
    const originalQueue = bot._client.queue.bind(bot._client);
    bot._client.queue = (name, params) => {
      if (name === 'client_information' || name === 'settings') {
        return; // Paketi sunucuya fırlatmadan yok et
      }
      return originalQueue(name, params);
    };

    // 2. Write Seviyesinde Engelleme
    const originalWrite = bot._client.write.bind(bot._client);
    bot._client.write = (name, params) => {
      if (name === 'client_information' || name === 'settings') {
        return; // Paketi sunucuya fırlatmadan yok et
      }
      return originalWrite(name, params);
    };
  }

  if (bot.settings) {
    bot.settings.send = () => {}; // Mineflayer'ın dahili ayar tetikleyicisini kapat
  }

  // --- PARÇACIK (PARTICLE) PROTOKOL HATALARINI YUTMA ---
  bot._client.on('error', (err) => {
    if (err && (err.name === 'PartialReadError' || (err.message && err.message.includes('Particle')))) {
      return;
    }
  });

  // --- OYUNA GİRİŞ AKIŞI ---
  bot.on('spawn', () => {
    console.log('>>> SUNUCUYA/BOYUTA GİRİŞ YAPILDI <<<');
    
    if (!isLoggedIn) {
      isLoggedIn = true;
      setTimeout(() => {
        if (bot) bot.chat(`/login ${CONFIG.password}`);
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
        if (bot) bot.chat('/skyblock');
        console.log('Skyblock sunucusuna geçiş komutu (/skyblock) gönderildi.');
      }, 3000);
    }

    // Skyblock sunucusuna aktarıldığında adaya ışınlan
    if (msg.includes('rebornsky') || msg.includes('ada') || msg.includes('hoş geldiniz')) {
      inSkyblock = true;
      setTimeout(() => {
        if (bot) bot.chat('/home');
        console.log('Adaya ışınlanma (/home) gönderildi.');
      }, 3000);
    }
  });

  // --- ZAMANLAYICILAR (INTERVALS) ---
  
  // 1. Anti-AFK (12 saniyede bir bakış açısı değiştirme ve kol sallama)
  const afkTimer = setInterval(() => {
    if (bot && bot.entity) {
      try {
        const newYaw = bot.entity.yaw + 0.1;
        bot.look(newYaw, bot.entity.pitch, true);
        bot.swingArm('right');
      } catch (e) {}
    }
  }, 12000);
  activeIntervals.push(afkTimer);

  // 2. Periyodik /home (SADECE Skyblock alanındaysa ve 3 dakikada bir)
  const homeTimer = setInterval(() => {
    if (bot && bot.entity && inSkyblock) {
      bot.chat('/home');
      console.log('Periyodik adaya dönme (/home) gönderildi.');
    }
  }, 3 * 60 * 1000);
  activeIntervals.push(homeTimer);

  // 3. Minyon Bulma ve Besleme (SADECE Skyblock alanındaysa)
  const minionTimer = setInterval(async () => {
    if (!bot || !bot.entity || !inSkyblock) return;

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
      } catch (err) {}
    }
  }, 15000);
  activeIntervals.push(minionTimer);

  // --- AÇILAN ARAYÜZ (GUI) İŞLEMLERİ ---
  bot.on('windowOpen', async (window) => {
    console.log(`>>> MENÜ AÇILDI: ${window.title} <<<`);
    const GOLDEN_APPLE_SLOT = 36; // Altın Elma Slotu (5. satır 1. sütun)

    setTimeout(async () => {
      try {
        await bot.clickWindow(GOLDEN_APPLE_SLOT, 0, 0);
        console.log('Minyon besleme butonuna (Altın Elma - Slot 36) tıklandı!');
        
        setTimeout(() => {
          if (bot) bot.closeWindow(window);
        }, 1000);
      } catch (err) {
        console.log('Arayüz tıklama hatası:', err.message);
      }
    }, 1200);
  });

  // Hata ve Bağlantı Kopması Yönetimi
  bot.on('kicked', (reason) => {
    console.log('!!! BOT SUNUCUDAN ATILDI !!!');
    console.log('Atılma Sebebi:', JSON.stringify(reason));
  });

  bot.on('error', (err) => {
    if (err && (err.name === 'PartialReadError' || (err.message && err.message.includes('Particle')))) return;
    console.log('!!! BOT HATA ALDI !!!', err.message);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu. Eski zamanlayıcılar temizleniyor...');
    clearAllIntervals();
    inSkyblock = false;
    setTimeout(createBot, 15000);
  });
}

createBot();
