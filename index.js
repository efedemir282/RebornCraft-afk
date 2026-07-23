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

let ziplamaInterval = null;
let kontrolInterval = null;
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
    checkTimeoutInterval: 60 * 1000,
    physicsEnabled: true // Zıplayabilmesi için fizik açıldı!
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

  // Paket uyarılarını gizle
  bot._client?.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('Particle')) return;
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

  // Sunucu mesajlarını dinle (Lobiye atılma durumu)
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

    // Zıplama Döngüsünü Başlat (40 saniyede bir)
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    ziplamaInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> AFK zıplaması yapılıyor...');
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot && bot.entity) bot.setControlState('jump', false);
        }, 500);
      }
    }, 40000);

    // 15 dakikalık periyodik /home emniyeti
    if (kontrolInterval) clearInterval(kontrolInterval);
    kontrolInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> Periyodik kontrol: Adaya /home çekiliyor...');
        komutGonder('/home');
      }
    }, 15 * 60 * 1000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot sunucudan atıldı:', reason);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu. 30 saniye sonra tekrar denenecek...');
    baglantiDenedi = false;
    akisBasladi = false;
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    if (kontrolInterval) clearInterval(kontrolInterval);
    setTimeout(botuBaslat, 30000);
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError') return;
    console.log('Hata oluştu:', err.message);
    baglantiDenedi = false;
    akisBasladi = false;
  });
}

botuBaslat();
