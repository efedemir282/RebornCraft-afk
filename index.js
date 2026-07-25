const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER PORT SİSTEMİ ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('Bot 7/24 Aktif!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[RENDER SİSTEMİ] Web sunucusu ${PORT} portunda aktif.`);
});

// --- GLOBAL ÇÖKME KORUMALARI ---
process.on('uncaughtException', (err) => {
  console.log('[Sistem Uyarısı] Hata:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.log('[Sistem Uyarısı] Rejection:', reason);
});

let afkInterval = null;
let kontrolInterval = null;
let minyonInterval = null;
let baglantiDenedi = false;

function botuBaslat() {
  if (baglantiDenedi) return;

  console.log('Sunucuya bağlanılıyor...');
  baglantiDenedi = true;

  let bot = null;

  try {
    bot = mineflayer.createBot({
      host: 'play.reborncraft.pw',
      port: 25565,
      username: 'xBetray_31_AFK',
      version: '1.21.6',
      viewDistance: 'tiny',
      checkTimeoutInterval: 120 * 1000,
      physicsEnabled: true // Hareket için fizik açık
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
    if (kontrolInterval) clearInterval(kontrolInterval);
    if (minyonInterval) clearInterval(minyonInterval);

    baglantiDenedi = false;
    
    if (bot) {
      try { bot.quit(); } catch (e) {}
      bot = null;
    }

    console.log('10 saniye sonra tekrar bağlanılacak...');
    setTimeout(botuBaslat, 10000);
  }

  // Minyon Besleme Fonksiyonu
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
      console.log('>> [MİNYON]: Yakında CEHENNEM minyonu bulunamadı!');
      return;
    }

    console.log('>> [MİNYON]: CEHENNEM Minyonuna sağ tıklanıyor...');

    const windowHandler = async (window) => {
      try {
        console.log(`>> [MİNYON]: Menü açıldı -> ${window.title}`);

        setTimeout(async () => {
          await bot.clickWindow(36, 0, 0);
          console.log('>> [MİNYON]: Altın elmaya basıldı, minyon beslendi! 🍏');

          setTimeout(() => {
            bot.closeWindow(window);
          }, 1000);
        }, 1500);

      } catch (err) {
        console.log('>> [MİNYON]: Besleme hatası:', err.message);
      }
    };

    bot.once('windowOpen', windowHandler);

    try {
      bot.activateEntity(minyon);
    } catch (err) {
      bot.removeListener('windowOpen', windowHandler);
      console.log('>> [MİNYON]: Minyona tıklanamadı:', err.message);
    }
  }

  // Adaya Dönüş
  function adayaDon() {
    console.log('>> Adaya dönülüyor...');

    setTimeout(() => komutGonder('/skyblock'), 3000);
    setTimeout(() => komutGonder('/is home'), 12000);
    setTimeout(() => komutGonder('/home'), 18000);
  }

  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);

    if (
      mesaj.includes('Lobiye') ||
      mesaj.includes('aktarıldınız') ||
      mesaj.includes('yeniden başlatılıyor') ||
      mesaj.includes('Lütfen giriş komutunu kullanın')
    ) {
      console.log('>> Lobi/Liman tespiti yapıldı! Adaya dönülüyor...');
      adayaDon();
    }
  });

  let akisBasladi = false;

  bot.on('spawn', () => {
    if (akisBasladi) return;
    akisBasladi = true;

    console.log('>> Bot oyuna bağlandı.');

    // Giriş ve Adaya Işınlanma
    setTimeout(() => komutGonder('/login efe43802'), 4000);
    setTimeout(() => adayaDon(), 8000);

    // BİZİ 7/24 OYUNDA TUTAN AFK HAREKET DÖNGÜSÜ (Her 25 Saniyede Bir Zıplama + Kol Sallama)
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> [AFK KORUMA]: Zıplama ve kol sallama yapılıyor...');
        bot.setControlState('jump', true);
        try { bot.swingArm('right'); } catch (e) {}

        setTimeout(() => {
          if (bot && bot.entity) {
            bot.setControlState('jump', false);
          }
        }, 400);
      }
    }, 25000);

    // İlk Girişte Minyon Besleme
    setTimeout(() => minyonuBesle(), 25000);

    // 15 Dakikada bir /home Emniyeti
    if (kontrolInterval) clearInterval(kontrolInterval);
    kontrolInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> Periyodik kontrol: Adaya /home çekiliyor...');
        komutGonder('/is home');
        setTimeout(() => komutGonder('/home'), 4000);
      }
    }, 15 * 60 * 1000);

    // 30 Dakikada bir Minyon Besleme
    if (minyonInterval) clearInterval(minyonInterval);
    minyonInterval = setInterval(() => {
      if (bot && bot.entity) {
        minyonuBesle();
      }
    }, 30 * 60 * 1000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot sunucudan atıldı! SEBEP:', JSON.stringify(reason));
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
