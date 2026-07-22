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
  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: false
  });

  bot.on('spawn', () => {
    console.log('Bot oyuna girdi!');

    // 1. Oyuna girer girmez (2. saniyede) Şifre Girişi Yapar
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('Giriş şifresi gönderildi.');
    }, 2000);

    // 2. Şifre girildikten sonra (5. saniyede) /home Noktasına Işınlanır
    setTimeout(() => {
      bot.chat('/home');
      console.log('Home noktasına ışınlanma komutu gönderildi.');
    }, 5000);

    // 3. 40 saniyede bir zıplama hareketi (AFK atılmamak için)
    setInterval(() => {
      if (bot) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 500);
      }
    }, 40000);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu, tekrar deneniyor...');
    setTimeout(botuBaslat, 10000);
  });

  bot.on('error', (err) => {
    console.log('Hata oluştu:', err);
  });
}

botuBaslat();
