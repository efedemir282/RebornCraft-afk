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
let baglantiDenedi = false;

function botuBaslat() {
  if (baglantiDenedi) return;

  console.log('Sunucuya bağlanılıyor...');
  baglantiDenedi = true;

  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: '1.20.4',
    viewDistance: 'far',
    checkTimeoutInterval: 60 * 1000
  });

  // Güvenli Sohbet Gönderme
  function komutGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut gönderilemedi:', e.message);
      }
    }
  }

  // Sunucu Sohbet Logları
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);
  });

  // BOT OYUNA GİRDİĞİ AN TEK BİR DİZİ SIRA ÇALIŞIR
  bot.once('spawn', () => {
    console.log('>> Bot lobiye girdi, komut sırası başlatıldı...');

    // 1. ADIM: 3. saniyede Login atar
    setTimeout(() => {
      komutGonder('/login efe43802');
      console.log('>> 1/3: /login gönderildi.');
    }, 3000);

    // 2. ADIM: 9. saniyede Skyblock sunucusuna geçer
    setTimeout(() => {
      komutGonder('/skyblock');
      console.log('>> 2/3: /skyblock gönderildi.');
    }, 9000);

    // 3. ADIM: 20. saniyede (Skyblock'a aktarıldıktan sonra) Adana gider
    setTimeout(() => {
      komutGonder('/home');
      console.log('>> 3/3: /home gönderildi.');
    }, 20000);
  });

  // AFK Zıplama Döngüsü (40 saniyede bir)
  if (ziplamaInterval) clearInterval(ziplamaInterval);
  ziplamaInterval = setInterval(() => {
    if (bot && bot.entity) {
      bot.setControlState('jump', true);
      setTimeout(() => {
        if (bot && bot.entity) bot.setControlState('jump', false);
      }, 500);
    }
  }, 40000);

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
