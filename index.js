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
    version: '1.21.6', // Skyblock sunucusunun kesin olarak istediği minimum sürüm
    viewDistance: 'tiny',
    checkTimeoutInterval: 60 * 1000
  });

  function komutGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut gönderilemedi:', e.message);
      }
    }
  }

  // Protokol/partikül uyarısı gibi önemsiz paket hatalarını gizle
  bot._client?.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('Particle')) return;
    console.log('Paket Uyarısı:', err.message);
  });

  // Sunucu mesajlarını konsola yazdır
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (mesaj) console.log(`[SUNUCU]: ${mesaj}`);
  });

  let akisBasladi = false;

  bot.on('spawn', () => {
    if (akisBasladi) return;
    akisBasladi = true;

    console.log('>> Bot lobiye bağlandı. Komut akışı başlatılıyor...');

    // 1. ADIM: Login
    setTimeout(() => {
      komutGonder('/login efe43802');
      console.log('>> [1/3] /login gönderildi.');
    }, 4000);

    // 2. ADIM: Skyblock sunucusuna geçiş
    setTimeout(() => {
      komutGonder('/skyblock');
      console.log('>> [2/3] /skyblock gönderildi.');
    }, 10000);

    // 3. ADIM: Ada evine ışınlanma (Skyblock aktarımı tamamlandıktan sonra)
    setTimeout(() => {
      komutGonder('/home');
      console.log('>> [3/3] /home gönderildi.');
    }, 22000);
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
    akisBasladi = false;
    if (ziplamaInterval) clearInterval(ziplamaInterval);
    setTimeout(botuBaslat, 30000);
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError') return;
    console.log('Hata oluştu:', err.message);
    baglantiDenedi = false;
    akisBasladi = false;
  });
}

botuBaslat();
