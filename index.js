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

function botuBaslat() {
  console.log('Sunucuya bağlanılmaya çalışılıyor...');

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.16.5' // Sürüm sabitlendi
  });

  bot.on('spawn', () => {
    console.log('Bot başarıyla oyuna girdi!');

    // 1. Şifre girişi (2. saniye)
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('Giriş şifresi gönderildi.');
    }, 2000);

    // 2. Home noktasına ışınlanma (5. saniye)
    setTimeout(() => {
      bot.chat('/home');
      console.log('Home noktasına ışınlanma komutu gönderildi.');
    }, 5000);

    // 3. AFK zıplama döngüsü (40 saniyede bir)
    setInterval(() => {
      if (bot) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 500);
      }
    }, 40000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot sunucudan atıldı. Sebep:', reason);
  });

  bot.on('end', (reason) => {
    console.log('Bağlantı koptu. Detay/Sebep:', reason);
    console.log('15 saniye sonra tekrar deneniyor...');
    setTimeout(botuBaslat, 15000);
  });

  bot.on('error', (err) => {
    console.log('Hata oluştu:', err.message);
  });
}

botuBaslat();
