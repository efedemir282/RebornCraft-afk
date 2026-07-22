const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot aktif ve çalışıyor!');
});

app.listen(PORT, () => {
  console.log('Web sunucusu hazır.');
});

let ziplamaInterval = null;
let baglantiDenedi = false;

function botuBaslat() {
  if (baglantiDenedi) {
    console.log('Zaten aktif bir bağlantı denemesi var, bekleniyor...');
    return;
  }

  console.log('Sunucuya bağlanılıyor...');
  baglantiDenedi = true;

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.16.5'
  });

  bot.once('spawn', () => {
    console.log('Bot başarıyla oyuna girdi! Komutlar sırayla gönderiliyor...');

    // 1. Şifre (3. saniye)
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('1. Şifre gönderildi.');
    }, 3000);

    // 2. Skyblock (8. saniye)
    setTimeout(() => {
      bot.chat('/skyblock');
      console.log('2. Skyblock sunucusuna geçiş komutu gönderildi.');
    }, 8000);

    // 3. Home (15. saniye)
    setTimeout(() => {
      bot.chat('/home');
      console.log('3. Home noktasına ışınlanma komutu gönderildi.');
    }, 15000);

    // AFK Zıplama Döngüsü
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    ziplamaInterval = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 500);
      }
    }, 40000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot sunucudan atıldı:', reason);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu. 30 saniye sonra tekrar denenecek...');
    baglantiDenedi = false;
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    setTimeout(botuBaslat, 30000); // Süre 30 saniyeye çıkarıldı
  });

  bot.on('error', (err) => {
    console.log('Hata oluştu:', err.message);
    baglantiDenedi = false;
  });
}

botuBaslat();
