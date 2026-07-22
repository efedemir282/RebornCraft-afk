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
    username: 'AFK_Karakter_Adin',
    version: false
  });

  bot.on('spawn', () => {
    console.log('Bot oyuna girdi!');

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
