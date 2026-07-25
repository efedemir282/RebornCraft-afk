const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot aktif!');
});

app.listen(PORT, () => {
  console.log('Web sunucusu hazır.');
});

// --- GLOBAL ÇÖKME KORUMALARI ---
process.on('uncaughtException', (err) => {
  console.log('[Sistem Uyarısı] Yakalanmayan Hata:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('[Sistem Uyarısı] Yakalanmayan Rejection:', reason);
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
      physicsEnabled: true
    });
  } catch (err) {
    console.log('Bot oluşturulurken hata:', err.message);
    sifirlaVeYenidenBaslat();
    return;
  }

  function komutGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut gönderilemedi:', e.message);
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

    console.log('15 saniye sonra bağlantı tekrar denenecek...');
    setTimeout(botuBaslat, 15000);
  }

  // Özel Minyonu İsmine Göre Bulma ve Besleme
  function minyonuBesle() {
    if (!bot || !bot.entity) return;

    // Etrafta ismi "CEHENNEM" içeren veya en yakın varlığı bul
    const minyon = bot.nearestEntity((e) => {
      const mesafe = e.position.distanceTo(bot.entity.position) < 4;
      if (!mesafe || e === bot.entity) return false;

      // Özel İsim Kontrolü (Hologram / Armor Stand)
      const customName = e.customName ? JSON.stringify(e.customName) : '';
      const isMinyonName = customName.toUpperCase().includes('CEHENNEM');

      return isMinyonName || e.type === 'object' || e.name === 'armor_stand';
    });

    if (!minyon) {
      console.log('>> [MİNYON]: Yakında CEHENNEM minyonu bulunamadı!');
      return;
    }

    console.log('>> [MİNYON]: CEHENNEM Minyonu tespit edildi, sağ tıklanıyor...');

    const windowHandler = async (window) => {
      try {
        console.log(`>> [MİNYON]: Menü açıldı -> ${window.title}`);

        // Slot 36 (Altın Elma)
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

  // Adaya Kesin Dönüş Fonksiyonu
  function adayaDon() {
    console.log('>> Adaya dönüş süreci başlatıldı...');

    setTimeout(() => {
      komutGonder('/skyblock');
    }, 2000);

    setTimeout(() => {
      console.log('>> /is home gönderiliyor...');
      komutGonder('/is home');
    }, 14000);

    setTimeout(() => {
      console.log('>> /home emniyeti gönderiliyor...');
      komutGonder('/home');
    }, 20000);
  }

  // Sunucu mesajlarını dinle
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);

    if (
      mesaj.includes('Lobiye') ||
      mesaj.includes('aktarıldınız') ||
      mesaj.includes('Aktarılıyorsunuz') ||
      mesaj.includes('yeniden başlatılıyor') ||
      mesaj.includes('Lütfen giriş komutunu kullanın')
    ) {
      console.log('>> Bot adadan ayrıldı/lobiye düştü! Adaya dönülüyor...');
      adayaDon();
    }
  });

  let akisBasladi = false;

  bot.on('spawn', () => {
    if (akisBasladi) return;
    akisBasladi = true;

    console.log('>> Bot oyuna bağlandı. Akış başlatılıyor...');

    // 1. ADIM: Login
    setTimeout(() => {
      komutGonder('/login efe43802');
      console.log('>> [1/3] /login gönderildi.');
    }, 4000);

    // 2. ADIM: Adaya Geçiş
    setTimeout(() => {
      adayaDon();
    }, 8000);

    // AFK Hareket Döngüsü (Zıplama + El Sallama - 30 saniyede bir)
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> AFK hareketi yapılıyor (Zıplama + El Sallama)...');
        
        bot.setControlState('jump', true);
        try { bot.swingArm('right'); } catch (e) {}

        setTimeout(() => {
          if (bot && bot.entity) {
            bot.setControlState('jump', false);
          }
        }, 500);
      }
    }, 30000);

    // İlk girişte 30. saniyede minyon beslemesi
    setTimeout(() => {
      minyonuBesle();
    }, 30000);

    // 15 dakikalık periyodik adaya dönüş kontrolü
    if (kontrolInterval) clearInterval(kontrolInterval);
    kontrolInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> Periyodik adaya dönüş emniyeti çalışıyor...');
        komutGonder('/is home');
        setTimeout(() => komutGonder('/home'), 5000);
      }
    }, 15 * 60 * 1000);

    // 30 dakikada bir Minyon Besleme
    if (minyonInterval) clearInterval(minyonInterval);
    minyonInterval = setInterval(() => {
      if (bot && bot.entity) {
        minyonuBesle();
      }
    }, 30 * 60 * 1000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot sunucudan atıldı:', reason);
    sifirlaVeYenidenBaslat();
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu.');
    sifirlaVeYenidenBaslat();
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('timed out')) return;
    console.log('Hata oluştu:', err.message);
    sifirlaVeYenidenBaslat();
  });
}

botuBaslat();
