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

  // version: false -> Sunucunun istediği protokolü otomatik algılar
  const bot = mineflayer.createBot({
    host: 'play.reborncraft.pw',
    port: 25565,
    username: 'xBetray_31_AFK',
    version: false,
    checkTimeoutInterval: 60 * 1000
  });

  function gundereGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut gönderilemedi:', e.message);
      }
    }
  }

  let loginAtildi = false;
  let skyblockAtildi = false;
  let homeAtildi = false;

  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);

    // Şifre Girişi
    if (!loginAtildi && (mesaj.includes('/login') || mesaj.includes('Giriş') || mesaj.includes('şifre'))) {
      loginAtildi = true;
      setTimeout(() => {
        gundereGonder('/login efe43802');
        console.log('>> /login komutu gönderildi.');
      }, 2000);
    }

    // Skyblock'a Geçiş
    if (loginAtildi && !skyblockAtildi && (mesaj.includes('başarıyla') || mesaj.includes('Hoş geldiniz') || mesaj.includes('Sunucu menüsüne'))) {
      skyblockAtildi = true;
      setTimeout(() => {
        gundereGonder('/skyblock');
        console.log('>> /skyblock komutu gönderildi.');
      }, 4000);
    }
  });

  bot.on('spawn', () => {
    console.log('>> Bot oyunda doğdu.');

    if (skyblockAtildi && !homeAtildi) {
      homeAtildi = true;
      setTimeout(() => {
        gundereGonder('/home');
        console.log('>> /home komutu gönderildi.');
      }, 5000);
    }
  });

  // AFK Zıplama
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
