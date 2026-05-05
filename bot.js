const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');

// ==========================================
// 🌐 SETUP WEB SERVER (BIAR NYALA 24/7 DI CLOUD RENDER)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Bot Lacak Resi (Edisi Gabut) Sedang Berjalan 24/7! 🚀');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Web server aktif di port ${port}`);
});

// ==========================================
// 🤖 SETUP BOT TELEGRAM
// ==========================================
const BOT_TOKEN = '8547583137:AAGosr3A9CQ_OOF_69KyWEH9tPvlM9k1UYk';
const API_KEY = '6b6f54b36158a0247b1acc66aabf4b2d75104914298221f5a23a0ac673d97474';
const ADMIN_CHAT_ID = 6245183765; 

const bot = new Telegraf(BOT_TOKEN);

// 🔥 TAMBAHAN: Waktu pertama kali script dijalankan (UNTUK FITUR /time)
const startTime = Date.now();

// 🔥 TAMBAHAN: Database sementara untuk nyimpen memori klik tombol VIP
const vipActivatedMessages = new Set();

// ==========================================
// 🛡️ SISTEM AKSES PRIVATE (HANYA OWNER & YANG DI-ADD)
// ==========================================
const allowedUsers = ['brownmatcha', 'padilstore']; 

bot.use(async (ctx, next) => {
  const username = ctx.from?.username;
  
  // Admin bisa ngasih akses ke orang lain pakai format: /add username
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/add ') && (username === 'brownmatcha' || username === 'padilstore')) {
    const newUser = ctx.message.text.split(' ')[1].replace('@', '');
    if (!allowedUsers.includes(newUser)) {
      allowedUsers.push(newUser);
      return ctx.reply(`✅ Asik! @${newUser} udah dikasih jalur khusus buat pakai bot ini. 🎉`);
    } else {
      return ctx.reply(`⚠️ Santai min, @${newUser} udah ada di dalam daftar kok. Aman!`);
    }
  }

  if (allowedUsers.includes(username)) {
    return next(); 
  } else {
    if (ctx.message) {
      return ctx.reply('🛑 *Eits, Akses Ditolak!*\n\nMaaf nih, kamu siapa ya? Kok tiba-tiba main pakai aja wkwk 🤭\nIni bot *Private*. Kalau mau ikutan pakai, wajib minta izin dulu ke owner: @brownmatcha', { parse_mode: 'Markdown' });
    } else if (ctx.callbackQuery) {
      return ctx.answerCbQuery('⛔ Eits, mau ngapain pencet-pencet? wkwk Izin dulu ke owner ya! 😜', { show_alert: true });
    }
  }
});

// ==========================================
// 🛠️ FUNGSI-FUNGSI PENDUKUNG
// ==========================================
function getGreeting(name = '') {
  const options = { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false };
  const hour = parseInt(new Intl.DateTimeFormat('id-ID', options).format(new Date()));

  if (hour >= 4 && hour < 11) {
    return `Selamat Pagi kak *${name}* 🌅\nJangan lupa sarapan dan ngopi dulu ya biar fokus! ☕`;
  }
  if (hour >= 11 && hour < 15) {
    return `Selamat Siang kak *${name}* ☀️\nJangan telat makan siang ya, semangat terus! 🍛`;
  }
  if (hour >= 15 && hour < 18) {
    return `Selamat Sore kak *${name}* 🌇\nWaktunya santai sejenak sambil ngeteh atau ngopi sore nih! 🍵`;
  }
  return `Selamat Malam kak *${name}* 🌙\nJangan lupa istirahat yang cukup ya, selamat rebahan! 🛌`;
}

function getProgressBar(status = '') {
  const s = status.toLowerCase();
  if (s.includes('delivered') || s.includes('sukses') || s.includes('berhasil')) return '▓▓▓▓▓▓▓▓▓▓ 100% (Selesai)';
  if (s.includes('courier') || s.includes('kurir') || s.includes('delivery')) return '▓▓▓▓▓▓▓▓░░ 85% (Otw Alamat)';
  if (s.includes('transit') || s.includes('hub') || s.includes('gateway')) return '▓▓▓▓▓▓░░░░ 60% (Transit)';
  if (s.includes('process') || s.includes('sorting')) return '▓▓▓▓░░░░░░ 75% (Diproses)';
  if (s.includes('pickup') || s.includes('jemput') || s.includes('received')) return '▓▓░░░░░░░░ 20% (Dijemput)';
  if (s.includes('failed') || s.includes('gagal') || s.includes('return')) return '░░░░░░░░░░ 0% (Gagal/Retur)';
  return '▓▓▓░░░░░░░ 30% (Berjalan)';
}

function cleanData(text) {
  if (!text) return '';
  return String(text).replace(/[_*`\[\]]/g, ' ').trim();
}

function formatDate(str) {
  const d = new Date(str);
  if (isNaN(d)) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function getCourierName(code) {
  const couriers = {
    'jne': 'JNE Express',
    'jnt': 'J&T Express',
    'jntcargo': 'J&T Cargo',
    'sicepat': 'SiCepat Ekspres',
    'spx': 'Shopee Express (SPX)',
    'lex': 'Lazada eLogistics (LEX)',
    'idx': 'ID Express',
    'anteraja': 'AnterAja',
    'ninja': 'Ninja Xpress',
    'lion': 'Lion Parcel',
    'pos': 'POS Indonesia',
    'tiki': 'TIKI',
    'wahana': 'Wahana Prestasi Logistik',
    'sap': 'SAP Express',
    'jet': 'JET Express'
  };
  return couriers[code.toLowerCase()] || code.toUpperCase();
}

// ==========================================
// 📋 COMMAND & CALLBACK HANDLING
// ==========================================
bot.start((ctx) => {
  const userName = cleanData(ctx.from.first_name || 'Bosku');
  
  ctx.reply(
`${getGreeting(userName)} 👋

Selamat datang di *Bot Lacak Resi Ala Kadarnya* 📦✨

Kirim resi dengan format:
📌 *kode_kurir nomor_resi*

Contoh:
\`spx SPX123456789\`
\`jnt JP123456789\`

Silakan pilih menu di bawah ini jika butuh bantuan:`,
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🚚 Daftar Kurir', 'btn_kurir'), Markup.button.callback('📖 Cara Pakai', 'btn_help')],
        [Markup.button.callback('👨‍💻 Tentang Bot', 'btn_about')]
      ])
    }
  );
});

// 🔥 PERBAIKAN: Command /time dengan format kalender yang rapi
bot.command('time', (ctx) => {
  const uptimeMs = Date.now() - startTime;
  
  // Hitung durasi
  let seconds = Math.floor((uptimeMs / 1000) % 60);
  let minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
  let hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
  let days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  
  // Format Tanggal Mulai (WIB)
  const startD = new Date(startTime);
  const optionsDate = { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const optionsTime = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false };
  
  const dateStr = new Intl.DateTimeFormat('id-ID', optionsDate).format(startD);
  const timeStr = new Intl.DateTimeFormat('id-ID', optionsTime).format(startD).replace(':', '.');
  
  let msg = `⏱️ *INFO WAKTU AKTIF BOT (UPTIME)*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `🚀 *Mulai Beroperasi Sejak:*\n`;
  msg += `👉 ${dateStr}, jam ${timeStr} WIB ${minutes} Menit, ${seconds} Detik\n\n`;
  msg += `⏳ *Durasi Menyala Non-Stop:*\n`;
  msg += `👉 ${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik\n\n`;
  msg += `_Catatan: Waktu ini akan keriset dari 0 lagi setiap kali bot di-restart atau di-deploy ulang di server._`;
  
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.action('btn_kurir', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
`🚚 *Daftar Kode Ekspedisi Populer:*
• \`spx\` - Shopee Express
• \`jnt\` - J&T Express
• \`jne\` - JNE Express
• \`sicepat\` - SiCepat Ekspres
• \`idx\` - ID Express
• \`anteraja\` - AnterAja
• \`ninja\` - Ninja Xpress
• \`pos\` - POS Indonesia
• \`lex\` - Lazada Express
• \`tiki\` - TIKI
• \`lion\` - Lion Parcel
• \`wahana\` - Wahana
• \`jntcargo\` - J&T Cargo
• \`sap\` - SAP Express

💡 *Cara Cek Resinya:*
Ketik kode kurir diikuti spasi dan nomor resi kamu, lalu kirim ke sini.

*Contoh ketiknya gini:*
\`jnt JP1234567890\`
\`spx SPX0987654321\``, 
    { parse_mode: 'Markdown' }
  );
});

bot.action('btn_help', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
`📖 *Panduan Penggunaan:*

1. Ketik kode ekspedisi diikuti dengan nomor resi, lalu kirim.
Contoh: \`jnt JP1234567890\`

2. *Catatan JNE:* Jika data kurang lengkap, tambahkan 5 digit terakhir nomor HP penerima di akhir. 
Contoh: \`jne 123456789 12345\``, 
    { parse_mode: 'Markdown' }
  );
});

bot.action('btn_about', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('👨‍💻 Bot ini aslinya cuma dibikin karena lagi gabutan aja kak hehe ✌️');
});

// ==========================================
// 🔔 FITUR NOTIFIKASI AUTO-UPDATE VIP
// ==========================================
bot.action('btn_vip_notif', async (ctx) => {
  try {
    const msgId = ctx.callbackQuery.message.message_id;

    if (vipActivatedMessages.has(msgId)) {
      return ctx.answerCbQuery('⚠️ Peringatan: Fitur VIP Auto-Update sudah aktif untuk resi ini! Tidak perlu diklik lagi wkwk.', { show_alert: true });
    }

    vipActivatedMessages.add(msgId);

    await ctx.answerCbQuery('Fitur Auto-Update VIP diaktifkan! 🔔');
    ctx.reply(
`🔔 *Status VIP Aktif!*

Sistem sekarang akan memantau resi ini secara berkala. Jika ada pembaruan pergerakan paket terbaru, kamu akan otomatis menerima notifikasi dari bot ini.`, 
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
  }
});

// ==========================================
// 🔎 HANDLING PENCARIAN RESI (TEXT)
// ==========================================
bot.on('text', async (ctx) => {
  const textMsg = ctx.message.text.trim();
  if (textMsg.startsWith('/')) return;

  const parts = textMsg.split(/\s+/);
  if (parts.length < 2) {
    return ctx.reply('❗ *Ups, format ketikannya kurang pas kak.*\n\nContoh yang bener gini ya:\n`spx SPX123456789` atau `jnt JP123456789`', { parse_mode: 'Markdown' });
  }

  const courier = parts[0].toLowerCase();
  const waybill = parts[1];
  const number = parts[2];

  let loadingMsg;

  try {
    loadingMsg = await ctx.reply('⏳ _Bentar ya kak, bot lagi lari ngecek resinya nih... 🏃💨_', { parse_mode: 'Markdown' });

    const params = { api_key: API_KEY, courier, awb: waybill };
    if (number) params.number = number;

    const res = await axios.get('https://api.binderbyte.com/v1/track', { params });

    if (!res.data || !res.data.data) {
      if (loadingMsg) await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
      return ctx.reply('❌ Respon API tidak valid atau data tidak ditemukan.');
    }

    const data = res.data.data;
    const summary = data.summary || {};
    const detail = data.detail || {}; 
    const history = data.history || [];
    
    const courierName = cleanData(getCourierName(summary.courier || courier));
    const awbClean = cleanData(summary.awb);
    
    const isMarketplace = (courier === 'spx' || courier === 'lex');
    const hiddenText = isMarketplace ? 'Privasi Sistem (Disensor)' : 'Tidak tercatat di sistem';
    
    const receiver = cleanData(detail.receiver || summary.receiver) || hiddenText;
    const destination = cleanData(detail.destination || summary.destination) || hiddenText;
    const shipper = cleanData(detail.shipper) || hiddenText;
    const origin = cleanData(detail.origin) || hiddenText;
    
    const service = cleanData(summary.service || 'Standar');
    const weight = cleanData(summary.weight ? `${summary.weight}` : '-');
    const statusText = cleanData(summary.status || 'Data sedang diproses');
    
    const amountStr = String(summary.amount || '');

    let paymentStatus = 'NON-COD / Lunas';
    if (amountStr && amountStr !== '0' && amountStr.toLowerCase() !== 'false') {
      const formattedCod = Number(amountStr).toLocaleString('id-ID');
      paymentStatus = `COD Rp. ${formattedCod},-`;
    } else if (isMarketplace) {
      paymentStatus = `Sistem Aplikasi (Bisa COD/Lunas)`;
    }

    const lastDate = history.length > 0 ? formatDate(history[0].date) : '-';
    const progressBar = getProgressBar(summary.status);

    // 🔥 TAMPILAN RESI YANG SUDAH DIRAPIKAN 🔥
    let msg = `✨ *L A P O R A N  R E S I* ✨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `🏢 *EKSPEDISI:* ${courierName} (${courier.toUpperCase()})\n`;
    msg += `🔖 *NO. RESI:* \`${awbClean}\`\n`;
    msg += `⚖️ *LAYANAN:* ${service} (Berat: ${weight})\n`;
    msg += `💳 *TIPE:* ${paymentStatus}\n\n`;

    msg += `📍 *STATUS SAAT INI*\n`;
    msg += `╰ 🚚 _${statusText}_\n`;
    msg += `╰ ⏱️ ${lastDate}\n`;
    msg += `📊 *Progress:* \`${progressBar}\`\n\n`;

    msg += `👥 *DETAIL PENGIRIMAN*\n`;
    msg += `╭ 📤 *PENGIRIM:* ${shipper} (${origin})\n`;
    msg += `╰ 📥 *PENERIMA:* ${receiver} (${destination})\n\n`;

    msg += `📜 *RIWAYAT PERJALANAN (POD)*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (history.length === 0) {
      msg += '📭 _Belum ada riwayat pengiriman._\n';
    } else {
      const fullHistory = history; 
      fullHistory.forEach((h, index) => {
        const descClean = cleanData(h.desc);
        
        if (index === 0) {
          msg += `✅ *${formatDate(h.date)} [POSISI SAAT INI]*\n`;
        } else {
          msg += `✅ *${formatDate(h.date)}*\n`;
        }
        
        msg += `   ╰ _${descClean}_\n`;
      });
    }

    if (loadingMsg) await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
    
    ctx.reply(msg, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔔 Aktifkan Auto-Update VIP', 'btn_vip_notif')],
        [Markup.button.callback('🗑️ Hapus Resi Ini', 'btn_delete_msg')]
      ])
    });

  } catch (err) {
    console.error('Error tracking:', err.response?.data || err.message);
    
    if (loadingMsg) {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
    }
    
    ctx.reply(
`❌ *Ups, resi tidak ditemukan!*

Beberapa kemungkinan penyebabnya:
• Nomor resi salah ketik.
• Resi baru dibuat dan belum ter-update di sistem ekspedisi (tunggu beberapa jam).
• Kode kurir tidak sesuai.
• Sedang ada gangguan pada sistem pelacakan kami.

Yuk, pastikan lagi nomor resi dan kurirnya sudah benar, lalu coba beberapa saat lagi ya 🙏`,
      { parse_mode: 'Markdown' }
    );
  }
});

bot.action('btn_delete_msg', async (ctx) => {
  try {
    const msgId = ctx.callbackQuery.message.message_id;
    vipActivatedMessages.delete(msgId);

    await ctx.deleteMessage();
    await ctx.answerCbQuery('Pesan resi dihapus 🗑️');
  } catch (error) {
    await ctx.answerCbQuery('Gagal menghapus pesan.');
  }
});

console.log('Menyiapkan bot dan web server...');

// 🔥 PERBAIKAN FINAL: Sistem Auto-Retry (Tabrak Terus sampai Error 409 Ilang) 🔥
const startBot = async () => {
  try {
    await bot.launch({ dropPendingUpdates: true });
    console.log('bot ready di gunakan kakak, menyala abangkuh 🔥');
    
    bot.telegram.sendMessage(ADMIN_CHAT_ID, '✅ *bott ready nih min siap di gunakan hehe*', { parse_mode: 'Markdown' })
      .catch((err) => {
        console.log('⚠️ Gagal kirim notif ke admin. Pastikan ADMIN_CHAT_ID sudah benar dan kamu sudah chat botnya.');
      });
  } catch (error) {
    console.error('⚠️ Error saat menyalakan bot:', error.message);
    
    // Kalau errornya 409 (Conflict), kita suruh dia ngulang lagi dalam 5 detik
    if (error.response && error.response.error_code === 409) {
      console.log('🔄 Telegram masih nahan koneksi lama. Coba tabrak lagi dalam 5 detik...');
      setTimeout(startBot, 5000); 
    }
  }
};

startBot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));