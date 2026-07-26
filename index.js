const mineflayer = require('mineflayer');
const express = require('express');

// ==========================================
// 1. RENDER WEB SUNUCUSU (Keep-Alive)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('xBetray_31_AFK Botu 7/24 Aktif!');
});

app.listen(PORT, () => {
  console.log(`[WEB]: Web sunucusu ${PORT} portunda sorunsuz başlatıldı.`);
});

// ==========================================
// 2. BOT AYARLARI (Senin Bilgilerin Göpülü)
// ==========================================
const CONFIG = {
  host: 'play.reborncraft.pw',
  port: 25565,
  username: 'xBetray_31_AFK',
  password: 'efe43802',
  targetUser: 'xBetray_31' // Komut verecek ana hesap
};

let bot = null;
let jumpInterval = null;
let homeInterval = null;
let minionInterval = null;
let isConnecting = false;
let tpaCooldown = false;
let isDropping = false;
let isExecutingCustom = false;

// Zamanlayıcı Temizliği
function tumZamanlayicilariTemizle() {
  if (jumpInterval) { clearInterval(jumpInterval); jumpInterval = null; }
  if (homeInterval) { clearInterval(homeInterval); homeInterval = null; }
  if (minionInterval) { clearInterval(minionInterval); minionInterval = null; }
}

// Güvenli Komut Gönderme
function komutGonder(komut) {
  if (bot && bot._client && typeof bot.chat === 'function') {
    try {
      bot.chat(komut);
    } catch (err) {
      console.log(`[HATA]: Komut gönderilemedi (${komut}):`, err.message);
    }
  }
}

// Bekletme Yardımcısı
const bekle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Oyuna Girişte Anti-Bot Hareketi
async function antiBotHareketi() {
  if (!bot || !bot.entity) return;
  console.log('[BOT]: Anti-bot hareketi yapılıyor (2 blok ileri, 2 blok geri)...');
  
  bot.setControlState('forward', true);
  await bekle(1200);
  bot.setControlState('forward', false);
  await bekle(300);

  bot.setControlState('back', true);
  await bekle(1200);
  bot.setControlState('back', false);
  await bekle(500);
}

// ==========================================
// 3. DİNAMİK KOMUT YÜRÜTÜCÜ
// ==========================================
async function noktaliKomutCalistir(komutMetni) {
  if (!bot || !komutMetni || isExecutingCustom) return;
  isExecutingCustom = true;

  try {
    console.log(`[BOT]: Noktalı komut algılandı: "${komutMetni}". Chate yazılıyor...`);
    komutGonder(komutMetni);
  } catch (err) {
    console.log('[HATA]: Dinamik komut hatası:', err.message);
  } finally {
    isExecutingCustom = false;
  }
}

// ==========================================
// 4. ENVANTER BOŞALTMA
// ==========================================
async function envanteriYereBosalt() {
  if (!bot || !bot.inventory || isDropping) return;
  isDropping = true;

  try {
    if (bot.currentWindow) {
      try { bot.closeWindow(bot.currentWindow); } catch (e) {}
      await bekle(500);
    }

    const skippedSlots = new Set();
    let droppedCount = 0;

    while (true) {
      const currentItems = bot.inventory.items().filter(item => !skippedSlots.has(item.slot));
      if (currentItems.length === 0) break;

      const item = currentItems[0];
      try {
        if (bot.entity) await bot.look(bot.entity.yaw, 0, true);
        await bot.tossStack(item);
        droppedCount++;
      } catch (err) {
        skippedSlots.add(item.slot);
      }
      await bekle(400);
    }

    console.log(`[BOT]: Toplam ${droppedCount} slot eşya atıldı!`);
  } catch (err) {
    console.log('[HATA]: Envanter boşaltma hatası:', err.message);
  } finally {
    isDropping = false;
  }
}

// ==========================================
// 5. BOT BAĞLANTI VE MANTIĞI
// ==========================================
function botuBaslat() {
  if (isConnecting) return;
  isConnecting = true;
  tumZamanlayicilariTemizle();

  console.log('[BOT]: Sunucuya bağlantı kuruluyor...');

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: false, // Sürüm ayarına dokunulmadı
    viewDistance: 'tiny',
    checkTimeoutInterval: 120 * 1000,
    physicsEnabled: true,
    hideErrors: true // Parçacık paket okuma hatalarını bastırır
  });

  let ilkGiris = true;

  bot.on('spawn', async () => {
    console.log('[BOT]: Bot oyuna yüklendi (Spawn).');

    if (ilkGiris) {
      ilkGiris = false;

      // 1. Giriş Yap
      await bekle(2000);
      komutGonder(`/login ${CONFIG.password}`);

      // 2. Skyblock'a Geç
      await bekle(4000);
      komutGonder('/skyblock');

      // 3. Yürü & /home At
      await bekle(5000);
      await antiBotHareketi();
      komutGonder('/home');
      console.log('[BOT]: /home komutu gönderildi.');

      // Zıplama (30s)
      jumpInterval = setInterval(() => {
        if (bot && bot.entity) {
          bot.setControlState('jump', true);
          setTimeout(() => { if (bot && bot.entity) bot.setControlState('jump', false); }, 500);
        }
      }, 30000);

      // Home (10dk)
      homeInterval = setInterval(() => {
        if (bot && bot.entity) komutGonder('/home');
      }, 10 * 60 * 1000);

      // Minyon Besleme Döngüsü (30dk)
      minionInterval = setInterval(async () => {
        if (!bot || !bot.entity) return;

        if (bot.currentWindow) {
          try { bot.closeWindow(bot.currentWindow); } catch (e) {}
          await bekle(500);
        }

        const minion = bot.nearestEntity(e => 
          (e.name === 'armor_stand' || e.type === 'object' || e.type === 'mob') &&
          e.id !== bot.entity.id
        );

        if (minion) {
          const mesafe = bot.entity.position.distanceTo(minion.position);
          console.log(`[BOT]: Minyon/Zırh askısı bulundu. Mesafe: ${mesafe.toFixed(2)} blok.`);

          if (mesafe <= 5) {
            try {
              await bot.lookAt(minion.position.offset(0, 1.2, 0));
              await bekle(300);
              bot.swingArm('right');
              bot.activateEntity(minion);
            } catch (err) {
              console.log('[HATA]: Minyon etkileşim hatası:', err.message);
            }
          }
        } else {
          console.log('[BOT]: Yakında beslenecek minyon bulunamadı.');
        }
      }, 30 * 60 * 1000);
    }
  });

  // Minyon Menüsü Açıldığında Altın Elmayı Tıkla (Slot 36)
  bot.on('windowOpen', async (window) => {
    console.log(`[BOT]: Menü açıldı -> ${window.title || 'Bilinmeyen'}`);
    setTimeout(async () => {
      try {
        await bot.clickWindow(36, 0, 0);
        console.log('[BOT]: Minyon besleme butonuna (Slot 36) basıldı!');
        setTimeout(() => {
          if (bot && bot.currentWindow) bot.closeWindow(window);
        }, 1000);
      } catch (err) {
        console.log('[HATA]: Tıklama hatası:', err.message);
      }
    }, 1200);
  });

  // Fısıltı Komutları
  bot.on('whisper', (username, message) => {
    if (username.toLowerCase() === CONFIG.targetUser.toLowerCase()) {
      const msg = message.trim();
      if (msg.startsWith('.')) {
        noktaliKomutCalistir(msg.substring(1).trim());
      } else if (msg.toLowerCase().includes('drop') || msg.toLowerCase().includes('bosalt')) {
        envanteriYereBosalt();
      } else if (msg.toLowerCase().includes('isinlan') && !tpaCooldown) {
        tpaCooldown = true;
        komutGonder(`/tpa ${CONFIG.targetUser}`);
        setTimeout(() => { tpaCooldown = false; }, 15000);
      }
    }
  });

  // Chat Dinleyici
  bot.on('message', (jsonMsg) => {
    const hamMesaj = jsonMsg.toString().trim();
    if (!hamMesaj) return;

    console.log(`[SUNUCU]: ${hamMesaj}`);
    const temiz = hamMesaj.toLowerCase();

    // Otomatik Login Yakalayıcı
    if (temiz.includes('/login') || temiz.includes('giris yapin') || temiz.includes('sifre')) {
      setTimeout(() => komutGonder(`/login ${CONFIG.password}`), 1000);
    }

    const hedefAitMi = temiz.includes(CONFIG.targetUser.toLowerCase());

    if (hedefAitMi) {
      const noktaliEsllesme = hamMesaj.match(new RegExp(`${CONFIG.targetUser}.*?[»>:]\\s*\\.(.+)`, 'i'));
      if (noktaliEsllesme && noktaliEsllesme[1]) {
        noktaliKomutCalistir(noktaliEsllesme[1].trim());
        return;
      }

      if (temiz.includes('drop') || temiz.includes('bosalt')) {
        if (!temiz.includes('temizlendi') && !temiz.includes('silindi')) envanteriYereBosalt();
      }

      if (temiz.includes('isinlan') && !tpaCooldown) {
        if (!temiz.includes('gonderildi') && !temiz.includes('kabul')) {
          tpaCooldown = true;
          komutGonder(`/tpa ${CONFIG.targetUser}`);
          setTimeout(() => { tpaCooldown = false; }, 15000);
        }
      }
    }

    if (temiz.includes('tpa') || temiz.includes('isinlanma istegi')) {
      if (!temiz.includes('gonderildi') && !temiz.includes('kabul edildi')) {
        setTimeout(() => komutGonder('/tpaccept'), 1000);
      }
    }

    if (temiz.includes('lobiye') || temiz.includes('aktarildiniz') || temiz.includes('yeniden baslatiliyor')) {
      setTimeout(() => komutGonder('/skyblock'), 4000);
      setTimeout(() => komutGonder('/home'), 12000);
    }
  });

  // Hata Yakalama (Parçacık hatalarını yutar)
  bot.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('timed out') || err.message?.includes('packet_world_particles')) return;
    console.log('[HATA]:', err.message);
  });

  bot.on('kicked', (reason) => console.log('[BOT]: Kicked:', reason));
  bot.on('end', () => {
    console.log('[BOT]: Bağlantı koptu. 15 sn sonra tekrar bağlanıyor...');
    isConnecting = false;
    tpaCooldown = false;
    isDropping = false;
    isExecutingCustom = false;
    tumZamanlayicilariTemizle();
    bot = null;
    setTimeout(botuBaslat, 15000);
  });
}

botuBaslat();
