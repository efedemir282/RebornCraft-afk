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
  if (baglantiDenedi) return;

  console.log('Sunucuya bağlanılıyor...');
  baglantiDenedi = true;

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.16.5'
  });

  // SUNUCUDAN GELEN TÜM SOHBET MESAJLARINI KONSOLA YAZDIRIR
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);
  });

  bot.once('spawn', () => {
    console.log('Bot ilk doğuşunu yaptı, işlemler başlatılıyor...');

    // 1. Şifre (3. saniye)
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('>> /login komutu atıldı.');
    }, 3000);

    // 2. Skyblock (8. saniye)
    setTimeout(() => {
      bot.chat('/skyblock');
      console.log('>> /skyblock komutu atıldı.');
    }, 8000);

    // 3. Home (15. saniye)
    setTimeout(() => {
      bot.chat('/home');
      console.log('>> /home komutu atıldı.');
    }, 15000);

    // AFK Zıplama
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    ziplamaInterval = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
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
    setTimeout(botuBaslat, 30000);
  });

  bot.on('error', (err) => {
    console.log('Hata oluştu:', err.message);
    baglantiDenedi = false;
  });
}

botuBaslat();
