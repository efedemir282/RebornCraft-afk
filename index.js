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

let kontrolInterval = null;
let minyonInterval = null;
let baglantiDenedi = false;

function botuBaslat() {
  if (baglantiDenedi) return;

  console.log('Sunucuya bağlanılıyor...');
  baglantiDenedi = true;

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.21.6',
    viewDistance: 'tiny',
    checkTimeoutInterval: 120 * 1000,
    physicsEnabled: true
  });

  function komutGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut gönderilemedi:', e.message);
      }
    }
  }

  // Minyonu Besleme Fonksiyonu
  function minyonuBesle() {
    if (!bot || !bot.entity) return;

    // Etraftaki en yakın minyonu (armor stand veya entity) bul
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

        // Altın Elma 36. slotta (5. satır 1. sütun)
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

  // Paket ve Zaman Aşımı Uyarılarını Yakala
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

    // İlk girişte 25. saniyede bir defa minyonu beslemeyi dene
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

    // Her 30 dakikada bir otomatik Minyon Besleme
    if (minyonInterval) clearInterval(minyonInterval);
    minyonInterval = setInterval(() => {
      if (bot && bot.entity) {
        minyonuBesle();
      }
    }, 30 * 60 * 1000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot sunucudan atıldı:', reason);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu. 15 saniye sonra tekrar deneniyor...');
    baglantiDenedi = false;
    akisBasladi = false;
    if (kontrolInterval) clearInterval(kontrolInterval);
    if (minyonInterval) clearInterval(minyonInterval);
    setTimeout(botuBaslat, 15000);
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('timed out')) return;
    console.log('Hata oluştu:', err.message);
    baglantiDenedi = false;
    akisBasladi = false;
  });
}

botuBaslat();
