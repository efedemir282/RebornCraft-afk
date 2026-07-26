const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'SUNUCU_IP',
  port: 25565,
  username: 'BOT_ADI',
  // Sürüm kısmını aynen senin çalışan ayarında bırakıyoruz
  hideErrors: true // Parçacık paket okuma hatalarının konsolu kilitlemesini engeller
});

// Paket okuma (PartialReadError) gibi kritik olmayan hatalarda botun çökmesini önleyelim
bot.on('error', (err) => {
  if (err.name === 'PartialReadError' || err.message.includes('packet_world_particles')) {
    return; // Parçacık hatası gelirse görmezden gel
  }
  console.log('[HATA]:', err.message);
});

// Chat'i dinleyip sunucu login isteyince otomatik şifre girsin
bot.on('messagestr', (message) => {
  console.log('[CHAT]:', message);

  // Sunucu mesajında /login uyarısı geçtiği an
  if (message.includes('/login')) {
    bot.chat('/login SIFRENIZ_BURAYA');
    console.log('[BOT]: /login komutu gönderildi.');
  }
});

// Doğma olayı gerçekleştiğinde
bot.once('spawn', () => {
  console.log('[BOT]: Sunucuya giriş yapıldı, doğma alanı yüklendi.');

  // Giriş işleminin tamamen tamamlanması için 5 saniye bekle, sonra /home at
  setTimeout(() => {
    bot.chat('/home');
    console.log('[BOT]: /home komutu gönderildi.');
  }, 5000);
});
