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
// 2. BOT AYARLARI
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
  if (jumpInterval) {
    clearInterval(jumpInterval);
    jumpInterval = null;
  }
  if (homeInterval) {
    clearInterval(homeInterval);
    homeInterval = null;
  }
  if (minionInterval) {
    clearInterval(minionInterval);
    minionInterval = null;
  }
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

// Oyuna Girişte 2 Blok İleri + 2 Blok Geri Hareketi
async function antiBotHareketi() {
  if (!bot || !bot.entity) return;
  console.log('[BOT]: Oyuna ilk giriş hareketi yapılıyor (2 blok ileri, 2 blok geri)...');
  
  // 1. ADIM: 2 Blok İleri
  bot.setControlState('forward', true);
  await bekle(1200);
  bot.setControlState('forward', false);
  await bekle(300);

  // 2. ADIM: 2 Blok Geri
  bot.setControlState('back', true);
  await bekle(1200);
  bot.setControlState('back', false);
  await bekle(500);
}

// ==========================================
// 3. ÖZEL DİNAMİK KOMUT YÜRÜTÜCÜ
// ==========================================
async function noktaliKomutCalistir(komutMetni) {
  if (!bot || !komutMetni) return;
  if (isExecutingCustom) return;

  isExecutingCustom = true;

  try {
    console.log(`[BOT]: Noktalı komut algılandı: "${komutMetni}". Doğrudan chate yazılıyor...`);
    komutGonder(komutMetni);
    console.log(`[BOT]: Genel chate yazıldı/komut çalıştırıldı: "${komutMetni}"`);
  } catch (err) {
    console.log('[HATA]: Dinamik komut hatası:', err.message);
  } finally {
    isExecutingCustom = false;
  }
}

// ==========================================
// 4. ENVANTER BOŞALTMA MANTIĞI
// ==========================================
async function envanteriYereBosalt() {
  if (!bot || !bot.inventory) return;

  if (isDropping) return;
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
      console.log(`[BOT]: Slot ${item.slot} (${item.displayName || item.name}) atılıyor...`);

      try {
        if (bot.entity) {
          await bot.look(bot.entity.yaw, 0, true);
        }
        await bot.tossStack(item);
        droppedCount++;
        console.log(`[BOT]: ${item.displayName || item.name} başarıyla atıldı.`);
      } catch (err) {
        console.log(`[HATA]: Slot ${item.slot} (${item.name}) atılamadı, atlanıyor. Sebep:`, err.message);
        skippedSlots.add(item.slot);
      }

      await bekle(400);
    }

    if (droppedCount > 0) {
      console.log(`[BOT]: Toplam ${droppedCount} slot eşya atıldı!`);
    } else {
      console.log('[BOT]: Atılabilecek eşya bulunamadı.');
    }

  } catch (err) {
    console.log('[HATA]: Envanter boşaltma genel hatası:', err.message);
  } finally {
    isDropping = false;
  }
}

// ==========================================
// 5. BOT MANTIĞI VE BAĞLANTI
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
    version: false,
    viewDistance: 'tiny',
    checkTimeoutInterval: 120 * 1000,
    physicsEnabled: true
  });

  let ilkGiris = true;

  // SPAWN
  bot.on('spawn', async () => {
    console.log('[BOT]: Bot oyuna yüklendi (Spawn).');

    if (ilkGiris) {
      ilkGiris = false;

      // 1. Login yap
      await bekle(3000);
      komutGonder(`/login ${CONFIG.password}`);

      // 2. Skyblock'a geç
      await bekle(4000);
      komutGonder('/skyblock');

      // 3. 2 blok ileri ve 2 blok geri yürü
      await bekle(5000);
      await antiBotHareketi();

      // 4. Yürüyüş biter bitmez /home yaz
      komutGonder('/home');
      console.log('[BOT]: İleri/geri hareket tamamlandı, /home komutu gönderildi.');

      // AFK Zıplama (30 saniyede bir)
      jumpInterval = setInterval(() => {
        if (bot && bot.entity) {
          bot.setControlState('jump', true);
          setTimeout(() => { if (bot && bot.entity) bot.setControlState('jump', false); }, 500);
        }
      }, 30000);

      // Periyodik Home (10 dakikada bir)
      homeInterval = setInterval(() => {
        if (bot && bot.entity) komutGonder('/home');
      }, 10 * 60 * 1000);

      // --- İYİLEŞTİRİLMİŞ MİNYON BESLEME DÖNGÜSÜ (30 DAKİKADA BİR) ---
      minionInterval = setInterval(async () => {
        if (!bot || !bot.entity) return;

        // Açık kalmış eski menü varsa zorla kapat
        if (bot.currentWindow) {
          try { bot.closeWindow(bot.currentWindow); } catch (e) {}
          await bekle(500);
        }

        // Yalnızca Zırh Askısı (Armor Stand / Minyon) olan entity'leri ara
        const minion = bot.nearestEntity(e => 
          (e.name === 'armor_stand' || e.type === 'object' || e.type === 'mob') &&
          e.id !== bot.entity.id
        );

        if (minion) {
          const mesafe = bot.entity.position.distanceTo(minion.position);
          console.log(`[BOT]: Minyon/Zırh askısı tespit edildi. Mesafe: ${mesafe.toFixed(2)} blok.`);

          if (mesafe <= 5) {
            try {
              console.log('[BOT]: Minyona bakılıyor ve besleme menüsü açılıyor...');
              await bot.lookAt(minion.position.offset(0, 1.2, 0));
              await bekle(300);
              bot.swingArm('right');
              bot.activateEntity(minion);
            } catch (err) {
              console.log('[HATA]: Minyon etkileşim hatası:', err.message);
            }
          } else {
            console.log('[BOT]: Minyon bulundu ancak 5 bloktan uzakta! (/home ile yakına çekilmeli)');
          }
        } else {
          console.log('[BOT]: Yakında beslenecek minyon (zırh askısı) bulunamadı.');
        }
      }, 30 * 60 * 1000);
    }
  });

  // ==========================================
  // 6. MİNYON MENÜSÜ AÇILDIĞINDA ALTIN ELMAYI TIKLAMA
  // ==========================================
  bot.on('windowOpen', async (window) => {
    console.log(`[BOT]: Menü açıldı -> ${window.title || 'Bilinmeyen Menü'}`);
    const GOLDEN_APPLE_SLOT = 36; // Altın Elma Slotu

    setTimeout(async () => {
      try {
        await bot.clickWindow(GOLDEN_APPLE_SLOT, 0, 0);
        console.log('[BOT]: Minyon besleme butonuna (Altın Elma - Slot 36) basıldı!');
        
        setTimeout(() => {
          if (bot && bot.currentWindow) {
            bot.closeWindow(window);
            console.log('[BOT]: Minyon menüsü kapatıldı.');
          }
        }, 1000);
      } catch (err) {
        console.log('[HATA]: Menü tıklama hatası:', err.message);
      }
    }, 1200);
  });

  // ==========================================
  // 7. FISILTI VE MESAJ DİNLENMESİ
  // ==========================================
  
  // KATMAN 1: Özel Fısıltı Modülü
  bot.on('whisper', (username, message) => {
    console.log(`[FISILTI]: ${username} -> ${message}`);
    if (username.toLowerCase() === CONFIG.targetUser.toLowerCase()) {
      const msg = message.trim();

      if (msg.startsWith('.')) {
        const komut = msg.substring(1).trim();
        noktaliKomutCalistir(komut);
        return;
      }
      
      if (msg.toLowerCase().includes('drop') || msg.toLowerCase().includes('bosalt') || msg.toLowerCase().includes('at')) {
        envanteriYereBosalt();
      } else if (msg.toLowerCase().includes('isinlan')) {
        if (!tpaCooldown) {
          tpaCooldown = true;
          komutGonder(`/tpa ${CONFIG.targetUser}`);
          setTimeout(() => { tpaCooldown = false; }, 15000);
        }
      }
    }
  });

  // KATMAN 2: Ham Chat Modülü
  bot.on('message', (jsonMsg) => {
    const hamMesaj = jsonMsg.toString().trim();
    if (!hamMesaj) return;

    console.log(`[SUNUCU]: ${hamMesaj}`);
    const temiz = hamMesaj.toLowerCase();

    // 1. Şifre İsteme
    if (temiz.includes('/login') || temiz.includes('giris yapin') || temiz.includes('sifre')) {
      setTimeout(() => komutGonder(`/login ${CONFIG.password}`), 1000);
    }

    const hedefAitMi = temiz.includes(CONFIG.targetUser.toLowerCase());

    // 2. HAM CHAT NOKTALI KOMUT YAKALAYICI
    if (hedefAitMi) {
      const noktaliEsllesme = hamMesaj.match(new RegExp(`${CONFIG.targetUser}.*?[»>:]\\s*\\.(.+)`, 'i'));
      if (noktaliEsllesme && noktaliEsllesme[1]) {
        const komut = noktaliEsllesme[1].trim();
        noktaliKomutCalistir(komut);
        return;
      }
    }

    // 3. ENVANTER BOŞALTMA KOMUTU
    if (hedefAitMi && (temiz.includes('drop') || temiz.includes('bosalt') || temiz.includes('at'))) {
      if (!temiz.includes('temizlendi') && !temiz.includes('silindi') && !temiz.includes('bosaltildi')) {
        envanteriYereBosalt();
      }
    }

    // 4. IŞINLANMA TETİKLEYİCİSİ
    if (hedefAitMi && temiz.includes('isinlan')) {
      const sistemMesaji =
        temiz.includes('gonderildi') ||
        temiz.includes('kabul') ||
        temiz.includes('saniye') ||
        temiz.includes('bekle') ||
        temiz.includes('isinlaniyor') ||
        temiz.includes('isinlandiniz');

      if (!sistemMesaji && !tpaCooldown) {
        tpaCooldown = true;
        komutGonder(`/tpa ${CONFIG.targetUser}`);
        setTimeout(() => { tpaCooldown = false; }, 15000);
      }
    }

    // 5. GELEN TPA İSTEKLERİNİ KABUL ETME
    if (temiz.includes('tpa') || temiz.includes('isinlanma istegi')) {
      if (!temiz.includes('gonderildi') && !temiz.includes('kabul edildi')) {
        setTimeout(() => komutGonder('/tpaccept'), 1000);
      }
    }

    // 6. LOBİYE DÜŞME
    if (temiz.includes('lobiye') || temiz.includes('aktarildiniz') || temiz.includes('yeniden baslatiliyor')) {
      setTimeout(() => komutGonder('/skyblock'), 4000);
      setTimeout(() => komutGonder('/home'), 12000);
    }
  });

  // KOPMA YÖNETİMİ
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
  bot.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('timed out')) return;
    console.log('[HATA]:', err.message);
  });
}

botuBaslat();
