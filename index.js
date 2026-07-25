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
// Kod içinde beklenmeyen bir hata oluşsa bile uygulamanın kapanmasını engeller
process.on('uncaughtException', (err) => {
  console.log('[Sistem Uyarısı] Yakalanmayan Hata:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('[Sistem Uyarısı] Yakalanmayan Rejection:', reason);
});

let ziplamaInterval = null;
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
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    if (kontrolInterval) clearInterval(kontrolInterval);
    if (minyonInterval) clearInterval(minyonInterval);

    baglantiDenedi = false;
    
    if (bot) {
      try { bot.quit(); } catch (e) {}
      bot = null;
    }

    console.log('10 saniye sonra bağlantı tekrar denenecek...');
    setTimeout(botuBaslat, 10000);
  }

  // Minyon Besleme Fonksiyonu
  function minyonuBesle() {
    if (!bot || !bot.entity) return;

    const minyon = bot.nearestEntity((e) => 
      e.position.distanceTo(bot.entity.position) < 4 && e !== bot.entity
    );

    if (!minyon) {
      console.log('>> [MİNYON]: Yakında beslenecek minyon bulunamadı!');
      return;
    }

    console.log('>> [MİNYON]: Minyona sağ tıklanıyor...');

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
        console.log('>> [MİNYON]: Besleme sırasında hata:', err.message);
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

  // Paket Hatalarını Yakala
  bot._client?.on('error', (err) => {
    if (
      err.name === 'PartialReadError' || 
      err.message?.includes('Particle') || 
      err.message?.includes('timed out')
    ) return;
    console.log('Paket Uyarısı:', err.message);
  });

  // Adaya Dönüş Fonksiyonu
  function adayaDon() {
    console.log('>> Adaya geri dönülüyor (/skyblock -> /home)...');
    setTimeout(() => {
      komutGonder('/skyblock');
    }, 2000);

    setTimeout(() => {
      komutGonder('/home');
    }, 12000);
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
      console.log('>> Bot adadan ayrıldı veya lobiye düştü! Tekrar adaya dönülüyor...');
      adayaDon();
    }
  });

  let akisBasladi = false;

  bot.on('spawn', () => {
    if (akisBasladi) return;
    akisBasladi = true;

    console.log('>> Bot oyuna bağlandı. Komut akışı başlatılıyor...');

    // 1. ADIM: Login
    setTimeout(() => {
      komutGonder('/login efe43802');
      console.log('>> [1/3] /login gönderildi.');
    }, 4000);

    // 2. ve 3. ADIM: Skyblock ve Home
    setTimeout(() => {
      adayaDon();
    }, 8000);

    // AFK Zıplaması + Kafa Döndürme (30 saniyede bir)
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    ziplamaInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> AFK hareketi yapılıyor (Zıplama + Bakış)...');
        
        // Zıpla
        bot.setControlState('jump', true);
        
        // Hafifçe bakış açısını değiştir (Anti-AFK bypass)
        const currentYaw = bot.entity.yaw;
        const currentPitch = bot.entity.pitch;
        bot.look(currentYaw + 0.2, currentPitch, true);

        setTimeout(() => {
          if (bot && bot.entity) {
            bot.setControlState('jump', false);
            bot.look(currentYaw, currentPitch, true); // Eski açısına geri dön
          }
        }, 500);
      }
    }, 30000);

    // İlk girişte 25. saniyede minyon beslemesi
    setTimeout(() => {
      minyonuBesle();
    }, 25000);

    // 15 dakikalık periyodik /home emniyeti
    if (kontrolInterval) clearInterval(kontrolInterval);
    kontrolInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> Periyodik kontrol: Adaya /home çekiliyor...');
        komutGonder('/home');
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
