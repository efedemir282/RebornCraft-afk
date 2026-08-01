const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER PORT VE WEB SUNUCUSU ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('xBetray_31_AFK Botu 7/24 Aktif!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] Web sunucusu ${PORT} portunda başarıyla başlatıldı.`);
});

// --- 2. GLOBAL ÇÖKME KORUMALARI ---
process.on('uncaughtException', (err) => {
  if (err.name === 'PartialReadError' || err.message?.includes('PartialReadError')) return;
  console.log('[Sistem Uyarısı] Hata:', err.message);
});

process.on('unhandledRejection', (reason) => {
  if (reason && (reason.name === 'PartialReadError' || reason.message?.includes('PartialReadError'))) return;
  console.log('[Sistem Uyarısı] Rejection:', reason);
});

let bot = null;
let afkInterval = null;
let kontrolInterval = null;
let isConnecting = false;
let activeTimeouts = [];

// ZAMANLAYICI TEMİZLEME MEKANİZMASI (HAYALET KOMUTLARI ENGELLER)
function safeTimeout(fn, delay) {
  const t = setTimeout(() => {
    fn();
    activeTimeouts = activeTimeouts.filter(item => item !== t);
  }, delay);
  activeTimeouts.push(t);
  return t;
}

function clearAllTimeouts() {
  activeTimeouts.forEach(t => clearTimeout(t));
  activeTimeouts = [];
}

function botuBaslat() {
  if (isConnecting) return;
  isConnecting = true;

  console.log('RebornCraft sunucusuna bağlanılıyor...');

  try {
    bot = mineflayer.createBot({
      host: 'play.reborncraft.pw',
      port: 25565,
      username: 'xBetray_31_AFK',
      version: '1.21.6',
      viewDistance: 'tiny',
      checkTimeoutInterval: 120 * 1000,
      physicsEnabled: true,
      hideErrors: true
    });
  } catch (err) {
    console.log('Bot başlatma hatası:', err.message);
    sifirlaVeYenidenBaslat();
    return;
  }

  function komutGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut hatası:', e.message);
      }
    }
  }

  function sifirlaVeYenidenBaslat() {
    clearAllTimeouts();
    if (afkInterval) clearInterval(afkInterval);
    if (kontrolInterval) clearInterval(kontrolInterval);

    isConnecting = false;

    if (bot) {
      try { bot.quit(); } catch (e) {}
      bot = null;
    }

    console.log('15 saniye sonra tekrar bağlanılacak...');
    setTimeout(botuBaslat, 15000);
  }

  // UZAKTAN /MSG İLE KONTROL FONKSİYONU
  function msgKomutIsle(gonderen, mesajIcerik) {
    const icerik = mesajIcerik.trim().toLowerCase();

    console.log(`>> [UZAKTAN KONTROL] ${gonderen} mesaj attı: ${mesajIcerik}`);

    if (icerik === 'home') {
      komutGonder('/home');
      komutGonder(`/msg ${gonderen} AFK konumuna (/home) ışınlanıldı!`);
    } else if (icerik === 'durum' || icerik === 'ping') {
      komutGonder(`/msg ${gonderen} Bot aktif! (xBetray_31_AFK)`);
    } else if (icerik.startsWith('komut ')) {
      const gonderilecekKomut = mesajIcerik.substring(6);
      komutGonder(gonderilecekKomut);
      komutGonder(`/msg ${gonderen} Komut çalıştırıldı: ${gonderilecekKomut}`);
    }
  }

  bot.on('whisper', (username, message) => {
    msgKomutIsle(username, message);
  });

  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);

    // Özel Mesaj Yakalama
    if (mesaj.includes('Sana:') || mesaj.includes('-> Sana')) {
      const parts = mesaj.split(/Sana:/i);
      if (parts.length > 1) {
        const mesajIcerik = parts[1].trim();
        const gonderenPart = parts[0].replace(/\[.*?\]/g, '').trim();
        const gonderen = gonderenPart.split(' ').pop().replace(/[^a-zA-Z0-9_]/g, '');
        if (gonderen) msgKomutIsle(gonderen, mesajIcerik);
      }
    }

    // Lobiye Düşme Kontrolü
    if (
      mesaj.includes('Lobiye aktarıldınız') ||
      mesaj.includes('Sunucu yeniden başlatılıyor')
    ) {
      console.log('>> Lobiye düşüldü! Skyblock ve /home çekiliyor...');
      komutGonder('/skyblock');
      safeTimeout(() => komutGonder('/home'), 6000);
    }
  });

  let spawnOldu = false;

  bot.on('spawn', () => {
    if (spawnOldu) return;
    spawnOldu = true;

    console.log('>> xBetray_31_AFK oyuna bağlandı (Spawn).');

    // 1. Şifre Gir (4. saniye)
    safeTimeout(() => {
      komutGonder('/login efe43802'); // <--- ŞİFRE GÜNCELLENDİ
      console.log('>> [1/3] /login gönderildi.');
    }, 4000);

    // 2. Skyblock Sunucusuna Geç (10. saniye)
    safeTimeout(() => {
      komutGonder('/skyblock');
      console.log('>> [2/3] Skyblock sunucusuna geçiş yapılıyor...');
    }, 10000);

    // 3. AFK Konumuna Çek (16. saniye)
    safeTimeout(() => {
      komutGonder('/home');
      console.log('>> [3/3] AFK alanına (/home) çekildi.');
    }, 16000);

    // AFK Zıplama & Kol Sallama (Her 25 saniyede bir)
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        try { bot.swingArm('right'); } catch (e) {}

        setTimeout(() => {
          if (bot && bot.entity) {
            bot.setControlState('jump', false);
          }
        }, 400);
      }
    }, 25000);

    // Periyodik Kontrol (Her 15 dakikada bir)
    if (kontrolInterval) clearInterval(kontrolInterval);
    kontrolInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> Periyodik kontrol: /home çekiliyor...');
        komutGonder('/home');
      }
    }, 15 * 60 * 1000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot atıldı! Sebep:', JSON.stringify(reason));
    sifirlaVeYenidenBaslat();
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu (end).');
    sifirlaVeYenidenBaslat();
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('PartialReadError') || err.message?.includes('timed out')) return;
    console.log('Hata oluştu:', err.message);
    sifirlaVeYenidenBaslat();
  });
}

botuBaslat();
