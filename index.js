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

  let loginAtildi = false;
  let skyblockAtildi = false;
  let homeAtildi = false;

  // Sunucu mesajlarını dinleme ve otomatik komut tetikleme
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);

    // Şifre girme uyarısı veya lobiye giriş
    if (!loginAtildi && (mesaj.includes('/login') || mesaj.includes('Giriş') || mesaj.includes('şifre'))) {
      loginAtildi = true;
      setTimeout(() => {
        bot.chat('/login efe43802');
        console.log('>> /login komutu gönderildi.');
      }, 2000);
    }

    // Skyblock'a geçiş komutu
    if (loginAtildi && !skyblockAtildi && (mesaj.includes('başarıyla') || mesaj.includes('Hoş geldiniz') || mesaj.includes('Sunucu menüsüne'))) {
      skyblockAtildi = true;
      setTimeout(() => {
        bot.chat('/skyblock');
        console.log('>> /skyblock komutu gönderildi.');
      }, 4000);
    }
  });

  // Dünya değiştiğinde (Lobiden Skyblock'a geçince) /home atma
  bot.on('spawn', () => {
    if (skyblockAtildi && !homeAtildi) {
      homeAtildi = true;
      console.log('>> Skyblock dunyasina girildi, /home atiliyor...');
      setTimeout(() => {
        bot.chat('/home');
        console.log('>> /home komutu gonderildi.');
      }, 5000);
    }
  });

  // Yedek Zamanlayıcı (Eğer sunucu mesajları yakalanamazsa garantiye almak için)
  setTimeout(() => {
    if (!loginAtildi) {
      bot.chat('/login efe43802');
      console.log('>> Yedek /login atıldı.');
    }
  }, 5000);

  setTimeout(() => {
    if (!skyblockAtildi) {
      bot.chat('/skyblock');
      console.log('>> Yedek /skyblock atıldı.');
    }
  }, 12000);

  setTimeout(() => {
    if (!homeAtildi) {
      bot.chat('/home');
      console.log('>> Yedek /home atıldı.');
    }
  }, 25000);

  // AFK Zıplama Döngüsü
  if (ziplamaInterval) clearInterval(ziplamaInterval);
  ziplamaInterval = setInterval(() => {
    if (bot && bot.entity) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
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
