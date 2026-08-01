const mineflayer = require('mineflayer');
const express = require('express');

// --- 1. RENDER PORT VE WEB SUNUCUSU ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('xBetray_31_AFK Minyon Besleme Botu 7/24 Aktif!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Express] Web sunucusu ${PORT} portunda başarıyla başlatıldı.`);
});

// --- 2. GLOBAL ÇÖKME KORUMALARI ---
process.on('uncaughtException', (err) => {
  if (err.name === 'PartialReadError' || err.message?.includes('PartialReadError')) return;
  console.log('[Sistem Uyarısı] Hata:', err.message);
});

process.on('unhandledRejection', (reason) => {
  if (reason && (reason.name === 'PartialReadError' || reason.message?.includes('PartialReadError'))) return;
  console.log('[Sistem Uyarısı] Rejection:', reason);
});

// --- 3. YETKİLİ HESAP LİSTESİ ---
const AUTHORIZED_USERS = ['xbetray_31', 'xeregos'];

let bot = null;
let afkInterval = null;
let kontrolInterval = null;
let isConnecting = false;
let activeTimeouts = [];

function safeTimeout(fn, delay) {
  const t = setTimeout(() => {
    fn();
    activeTimeouts = activeTimeouts.filter(item => item !== t);
  }, delay);
  activeTimeouts.push(t);
  return t;
}

function clearAllTimeouts() {
  activeTimeouts.forEach(t => clearTimeout(t));
  activeTimeouts = [];
}

function botuBaslat() {
  if (isConnecting) return;
  isConnecting = true;

  console.log('RebornCraft sunucusuna bağlanılıyor...');

  try {
    bot = mineflayer.createBot({
      host: 'play.reborncraft.pw',
      port: 25565,
      username: 'xBetray_31_AFK',
      version: '1.21.6',
      viewDistance: 'tiny',
      checkTimeoutInterval: 120 * 1000,
      physicsEnabled: true,
      hideErrors: true
    });
  } catch (err) {
    console.log('Bot başlatma hatası:', err.message);
    sifirlaVeYenidenBaslat();
    return;
  }

  function komutGonder(komut) {
    if (bot && bot._client && typeof bot.chat === 'function') {
      try {
        bot.chat(komut);
      } catch (e) {
        console.log('Komut hatası:', e.message);
      }
    }
  }

  // ENVANTER BOŞALTMA FONKSİYONU
  async function esyalariBosalt(gonderen) {
    if (!bot || !bot.inventory) return;

    const items = bot.inventory.items();
    if (items.length === 0) {
      komutGonder(`/msg ${gonderen} Envanterimde atılacak eşya yok!`);
      return;
    }

    komutGonder(`/msg ${gonderen} Envanterdeki tüm eşyalar yere atılıyor...`);

    for (const item of items) {
      try {
        await bot.tossStack(item);
        await new Promise(r => setTimeout(r, 250));
      } catch (err) {
        console.log('Eşya atma hatası:', err.message);
      }
    }

    komutGonder(`/msg ${gonderen} Tüm eşyalar başarıyla yere atıldı!`);
  }

  // MİNYON BESLEME (36. SLOT ALTIN ELMA)
  function minyonBesle() {
    if (!bot || !bot.entity) return;

    try {
      bot.once('windowOpen', (window) => {
        console.log(`>> [MİNYON MENÜSÜ] Menü açıldı: ${window.title || 'Minyon Paneli'}`);
        
        safeTimeout(() => {
          try {
            const TARGET_SLOT = 36;
            bot.clickWindow(TARGET_SLOT, 0, 0);
            console.log(`>> [MİNYON] ${TARGET_SLOT}. slottaki Altın Elma'ya basıldı!`);
          } catch (e) {
            console.log('Menü içi tıklama hatası:', e.message);
          }
        }, 1200);
      });

      const minyon = bot.nearestEntity(e => {
        const entityName = (e.customName || e.name || '').toLowerCase();
        return (
          entityName.includes('cehennem') ||
          e.name === 'armor_stand' ||
          e.name === 'villager' ||
          e.type === 'object' ||
          e.type === 'mob'
        );
      });

      if (minyon && bot.entity.position.distanceTo(minyon.position) <= 4) {
        bot.activateEntity(minyon);
        bot.swingArm('right');
        console.log(`>> [MİNYON] Minyona sağ tıklandı...`);
      } else {
        bot.swingArm('right');
        const targetBlock = bot.blockAtCursor(4);
        if (targetBlock) {
          bot.activateBlock(targetBlock);
          console.log('>> [MİNYON] Bakılan bloğa sağ tıklandı...');
        }
      }
    } catch (err) {
      console.log('Minyon besleme hatası:', err.message);
    }
  }

  function sifirlaVeYenidenBaslat() {
    clearAllTimeouts();
    if (afkInterval) clearInterval(afkInterval);
    if (kontrolInterval) clearInterval(kontrolInterval);

    isConnecting = false;

    if (bot) {
      try { bot.quit(); } catch (e) {}
      bot = null;
    }

    console.log('15 saniye sonra tekrar bağlanılacak...');
    setTimeout(botuBaslat, 15000);
  }

  // ÖZEL MESAJ / KOMUT İŞLEME MERKEZİ
  function msgKomutIsle(gonderen, mesajIcerik) {
    if (!gonderen) return;
    const gonderenTemiz = gonderen.replace(/[^a-zA-Z0-9_]/g, '');
    const gonderenLower = gonderenTemiz.toLowerCase();

    // Sadece Yetkili Kullanıcılar
    if (!AUTHORIZED_USERS.includes(gonderenLower)) {
      return;
    }

    const rawMessage = mesajIcerik.trim();
    const icerik = rawMessage.toLowerCase();
    console.log(`>> [YETKİLİ MESAJ] ${gonderenTemiz}: ${rawMessage}`);

    // 1. CHAT'E YAZI YAZDIRMA (!mesaj)
    if (rawMessage.startsWith('!')) {
      const gonderilecekMesaj = rawMessage.substring(1).trim();
      if (gonderilecekMesaj.length > 0) {
        komutGonder(gonderilecekMesaj);
        console.log(`>> [GENEL CHAT] YAZILDI: ${gonderilecekMesaj}`);
      }
    }
    // 2. TPA KOMUTLARI
    else if (icerik === 'tpa') {
      komutGonder(`/tpa ${gonderenTemiz}`);
      console.log(`>> [TPA] /tpa ${gonderenTemiz} komutu gönderildi!`);
    } else if (icerik.startsWith('tpa ')) {
      const hedefKullanici = rawMessage.substring(4).trim();
      komutGonder(`/tpa ${hedefKullanici}`);
      console.log(`>> [TPA] /tpa ${hedefKullanici} komutu gönderildi!`);
    }
    // 3. ENVANTER BOŞALTMA KOMUTU
    else if (icerik === 'bosalt' || icerik === 'boşalt') {
      esyalariBosalt(gonderenTemiz);
    }
    // 4. DİĞER KOMUTLAR
    else if (icerik === 'home') {
      komutGonder('/home');
    } else if (icerik === 'besle') {
      minyonBesle();
    }
  }

  // Fısıltı dinleyicisi
  bot.on('whisper', (username, message) => {
    msgKomutIsle(username, message);
  });

  // Sunucu Chat satırı dinleyicisi
  bot.on('message', (jsonMsg) => {
    const mesaj = jsonMsg.toString().trim();
    if (!mesaj) return;
    console.log(`[SUNUCU]: ${mesaj}`);

    const mesajLower = mesaj.toLowerCase();

    // TPA İsteği Geldiğinde Otomatik Kabul
    if (mesajLower.includes('size ışınlanmak istiyor') || (mesajLower.includes('tpa') && mesajLower.includes('kabul'))) {
      safeTimeout(() => komutGonder('/tpaccept'), 1000);
      console.log('>> [TPA] Gelen TPA kabul edildi (/tpaccept).');
    }

    // Yetkili Kullanıcılardan Gelen Mesajları Çözümleme
    AUTHORIZED_USERS.forEach(user => {
      if (mesajLower.includes(user)) {
        // Eğer mesaj '!' ile başlıyorsa (Chat mesajı)
        const exclamationIndex = mesaj.indexOf('!');
        if (exclamationIndex !== -1) {
          const chatMsg = mesaj.substring(exclamationIndex + 1).trim();
          if (chatMsg) komutGonder(chatMsg);
        }
        // Eğer 'tpa' kelimesi geçiyorsa
        else if (mesajLower.includes('tpa')) {
          komutGonder(`/tpa ${user}`);
          console.log(`>> [TPA TETİKLENDİ] /tpa ${user} gönderildi.`);
        }
        // Eğer 'bosalt' kelimesi geçiyorsa
        else if (mesajLower.includes('bosalt') || mesajLower.includes('boşalt')) {
          esyalariBosalt(user);
        }
      }
    });

    // Lobiye Düşme Kontrolü
    if (
      mesaj.includes('Lobiye aktarıldınız') ||
      mesaj.includes('Sunucu yeniden başlatılıyor')
    ) {
      console.log('>> Lobiye düşüldü! Skyblock ve /home çekiliyor...');
      komutGonder('/skyblock');
      safeTimeout(() => komutGonder('/home'), 6000);
    }
  });

  let spawnOldu = false;

  bot.on('spawn', () => {
    if (spawnOldu) return;
    spawnOldu = true;

    console.log('>> xBetray_31_AFK oyuna bağlandı (Spawn).');

    // 1. Şifre Gir
    safeTimeout(() => {
      komutGonder('/login efe43802');
      console.log('>> [1/3] /login gönderildi.');
    }, 4000);

    // 2. Skyblock Sunucusuna Geç
    safeTimeout(() => {
      komutGonder('/skyblock');
      console.log('>> [2/3] Skyblock sunucusuna geçiş yapılıyor...');
    }, 10000);

    // 3. Minyon Konumuna Çek
    safeTimeout(() => {
      komutGonder('/home');
      console.log('>> [3/3] Minyon alanına (/home) çekildi.');
    }, 16000);

    // 4. Periyodik Minyon Besleme (30 Dakikada Bir)
    if (afkInterval) clearInterval(afkInterval);
    afkInterval = setInterval(() => {
      if (bot && bot.entity) {
        console.log('>> [30 DK DÖNGÜSÜ] Minyon besleme tetikleniyor...');
        minyonBesle();
      }
    }, 30 * 60 * 1000);

    // 5. Periyodik Konum Kontrolü (15 Dakikada Bir)
    if (kontrolInterval) clearInterval(kontrolInterval);
    kontrolInterval = setInterval(() => {
      if (bot && bot.entity) {
        komutGonder('/home');
      }
    }, 15 * 60 * 1000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot atıldı! Sebep:', JSON.stringify(reason));
    sifirlaVeYenidenBaslat();
  });

  bot.on('end', () => {
    console.log('Bağlantı koptu (end).');
    sifirlaVeYenidenBaslat();
  });

  bot.on('error', (err) => {
    if (err.name === 'PartialReadError' || err.message?.includes('PartialReadError') || err.message?.includes('timed out')) return;
    console.log('Hata oluştu:', err.message);
    sifirlaVeYenidenBaslat();
  });
}

botuBaslat();
