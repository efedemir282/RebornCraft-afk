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

  // Sunucu mesajlarını konsola yazdır
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);
  });

  bot.once('spawn', () => {
    console.log('Bot ilk doğuşunu yaptı, komut akışı başlatılıyor...');

    // 1. ADIM: 4. saniyede Şifre Girer
    setTimeout(() => {
      bot.chat('/login efe43802');
      console.log('>> /login komutu atıldı.');
    }, 4000);

    // 2. ADIM: 10. saniyede Skyblock Sunucusuna Geçer
    setTimeout(() => {
      bot.chat('/skyblock');
      console.log('>> /skyblock komutu atıldı (Aktarım bekleniyor...).');
    }, 10000);

    // 3. ADIM: 22. saniyede (Skyblock'a geçiş tamamlandıktan sonra) Home noktasına gider
    setTimeout(() => {
      bot.chat('/home');
      console.log('>> /home komutu atıldı.');
    }, 22000);

    // AFK Zıplama Döngüsü
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
