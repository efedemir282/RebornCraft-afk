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

function botuBaslat() {
  console.log('Sunucuya bağlanılıyor...');

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.16.5'
  });

  // 'once' kullanarak komut akışının sadece İLK GİRİŞTE 1 kez çalışmasını sağlıyoruz
  bot.once('spawn', () => {
    console.log('Bot ilk kez doğdu, komut sırası başlatılıyor...');

    // 1. ADIM: 3. saniyede Şifre Girer
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('1. Şifre gönderildi.');
    }, 3000);

    // 2. ADIM: 8. saniyede Skyblock Sunucusuna Geçer
    setTimeout(() => {
      bot.chat('/skyblock');
      console.log('2. Skyblock sunucusuna geçiş komutu gönderildi.');
    }, 8000);

    // 3. ADIM: 15. saniyede Home Noktasına Işınlanır
    setTimeout(() => {
      bot.chat('/home');
      console.log('3. Home noktasına ışınlanma komutu gönderildi.');
    }, 15000);

    // Eski zıplama döngüsü varsa temizle, yenisini başlat
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
    console.log('Bağlantı koptu, 15 saniye sonra tekrar deneniyor...');
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    setTimeout(botuBaslat, 15000);
  });

  bot.on('error', (err) => {
    console.log('Hata oluştu:', err.message);
  });
}

botuBaslat();
