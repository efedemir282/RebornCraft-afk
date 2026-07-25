const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER PORT VE WEB SUNUCUSU (503 HATASINI ENGELLEMEK İÇİN) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('Nether Minyon Botu 7/24 Aktif!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] Web sunucusu ${PORT} portunda başarıyla başlatıldı.`);
});

// --- 2. GLOBAL ÇÖKME KORUMALARI ---
process.on('uncaughtException', (err) => {
  console.log('[Sistem Uyarısı] Hata:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.log('[Sistem Uyarısı] Rejection:', reason);
});

let bot = null;
let afkInterval = null;
let minyonInterval = null;
let kontrolInterval = null;
let isConnecting = false;

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
      physicsEnabled: true
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
    if (afkInterval) clearInterval(afkInterval);
    if (minyonInterval) clearInterval(minyonInterval);
    if (kontrolInterval) clearInterval(kontrolInterval);

    isConnecting = false;

    if (bot) {
      try { bot.quit(); } catch (e) {}
      bot = null;
    }

    console.log('10 saniye sonra tekrar bağlanılacak...');
    setTimeout(botuBaslat, 10000);
  }

  // NETHER MİNYON BESLEME FONKSİYONU
  function minyonuBesle() {
    if (!bot || !bot.entity) return;

    const minyon = bot.nearestEntity((e) => {
      const mesafe = e.position.distanceTo(bot.entity.position) < 4;
      if (!mesafe || e === bot.entity) return false;

      const customName = e.customName ? JSON.stringify(e.customName) : '';
      const isMinyonName = customName.toUpperCase().includes('CEHENNEM');

      return isMinyonName || e.type === 'object' || e.name === 'armor_stand';
    });

    if (!minyon) {
      console.log('>> [NETHER MİNYON]: Yakında CEHENNEM minyonu bulunamadı!');
      return;
    }

    console.log('>> [NETHER MİNYON]: Minyon tespit edildi, sağ tıklanıyor...');

    const windowHandler = async (window) => {
      try {
        console.log(`>> [NETHER MİNYON]: Menü açıldı -> ${window.title}`);

        setTimeout(async () => {
          await bot.clickWindow(36, 0, 0);
          console.log('>> [NETHER MİNYON]: Altın elmaya basıldı, minyon beslendi! 🍏');

          setTimeout(() => {
            bot.closeWindow(window);
          }, 1000);
        }, 1500);

      } catch (err) {
        console.log('>> [NETHER MİNYON]: Besleme hatası:', err.message);
      }
    };

    bot.once('windowOpen', windowHandler);

    try {
      bot.activateEntity(minyon);
    } catch (err) {
      bot.removeListener('windowOpen', windowHandler);
      console.log('>> [NETHER MİNYON]: Minyona tıklanamadı:', err.message);
    }
  }

  // NETHER HOME DÖNÜŞ FONKSİYONU
  function netherHomeDon() {
    console.log('>> Nether evine (/home) ışınlanılıyor...');
    setTimeout(() => komutGonder('/skyblock'), 2000);
    setTimeout(() => komutGonder('/home'), 8000);
  }

  // SUNUCU CHAT LOGLARI VE LOBİ KONTROLÜ
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);

    if (
      mesaj.includes('Lobiye') ||
      mesaj.includes('aktarıldınız') ||
      mesaj.includes('yeniden başlatılıyor') ||
      mesaj.includes('Lütfen giriş komutunu kullanın')
    ) {
      console.log('>> Lobiye düştü! Tekrar Nether evine dönülüyor...');
      netherHomeDon();
    }
  });

  let spawnOldu = false;

  bot.on('spawn', () => {
    if (spawnOldu) return;
    spawnOldu = true;

    console.log('>> Bot oyuna bağlandı.');

    // 1. Giriş Yap ve Nether Evine Işınlan
    setTimeout(() => {
      komutGonder('/login efe43802');
      console.log('>> [1/2] /login gönderildi.');
    }, 4000);

    setTimeout(() => {
      komutGonder('/home');
      console.log('>> [2/2] Nether evine (/home) çekildi.');
    }, 10000);

    // 2. AFK Zıplama & Kol Sallama (Her 25 saniyede bir)
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

    // 3. İlk Minyon Besleme (Girişten 25 saniye sonra)
    setTimeout(() => {
      minyonuBesle();
    }, 25000);

    // 4. Periyodik Minyon Besleme (Her 30 dakikada bir)
    if (minyonInterval) clearInterval(minyonInterval);
    minyonInterval = setInterval(() => {
      if (bot && bot.entity) {
        minyonuBesle();
      }
    }, 30 * 60 * 1000);

    // 5. Periyodik Nether /home Emniyeti (Her 15 dakikada bir)
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
    if (err.name === 'PartialReadError' || err.message?.includes('timed out')) return;
    console.log('Hata oluştu:', err.message);
    sifirlaVeYenidenBaslat();
  });
}

botuBaslat();
