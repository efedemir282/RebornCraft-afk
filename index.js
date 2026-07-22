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
  console.log('Sunucuya bağlanılıyor...');

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.16.5'
  });

  bot.on('spawn', () => {
    console.log('Bot lobide doğdu!');

    // 1. ADIM: 3. saniyede Şifre Girer
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('1. Şifre gönderildi.');
    }, 3000);

    // 2. ADIM: 7. saniyede Oyun Sunucusuna (Skyblock) Bağlanır
    setTimeout(() => {
      bot.chat('/skyblock'); // Sunucudaki mod ismi farklıysa (örn: /ada veya /is) burayı değiştirebilirsin
      console.log('2. Skyblock sunucusuna geçiş komutu gönderildi.');
    }, 7000);

    // 3. ADIM: 12. saniyede Home Noktasına Işınlanır
    setTimeout(() => {
      bot.chat('/home');
      console.log('3. Home noktasına ışınlanma komutu gönderildi.');
    }, 12000);

    // 4. ADIM: 40 saniyede bir AFK kalmama zıplaması
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
    console.log('Bot sunucudan atıldı:', reason);
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu, 15 saniye sonra tekrar deneniyor...');
    setTimeout(botuBaslat, 15000);
  });

  bot.on('error', (err) => {
    console.log('Hata oluştu:', err.message);
  });
}

botuBaslat();
