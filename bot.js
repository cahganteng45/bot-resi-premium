const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const express = require('express');

// ==========================================
// 🌐 SETUP WEB SERVER (BIAR NYALA 24/7 DI CLOUD RENDER)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Bot Lacak Resi Premium Sedang Berjalan 24/7!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 Web server aktif di port ${port}`);
});

// ==========================================
// 🤖 SETUP BOT TELEGRAM
// ==========================================
const BOT_TOKEN = '8547583137:AAGosr3A9CQ_OOF_69KyWEH9tPvlM9k1UYk';
const API_KEY = '6b6f54b36158a0247b1acc66aabf4b2d75104914298221f5a23a0ac673d97474';

const bot = new Telegraf(BOT_TOKEN);

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi 🌅';
  if (hour < 15) return 'Selamat Siang ☀️';
  if (hour < 18) return 'Selamat Sore 🌇';
  return 'Selamat Malam 🌙';
}

function getProgressBar(status = '') {
  const s = status.toLowerCase();
  if (s.includes('delivered') || s.includes('sukses') || s.includes('berhasil')) return '▓▓▓▓▓▓▓▓▓▓ 100% (Selesai)';
  if (s.includes('courier') || s.includes('kurir') || s.includes('delivery')) return '▓▓▓▓▓▓▓▓░░ 85% (Otw Alamat)';
  if (s.includes('transit') || s.includes('hub') || s.includes('gateway')) return '▓▓▓▓▓▓░░░░ 60% (Transit)';
  if (s.includes('process') || s.includes('sorting')) return '▓▓▓▓░░░░░░ 40% (Diproses)';
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

bot.start((ctx) => {
  const userName = cleanData(ctx.from.first_name || 'Kak');
  ctx.reply(
`${getGreeting()} *${userName}*! 👋

Selamat datang di *Bot Lacak Resi Premium*.

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
• \`sap\` - SAP Express`, 
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
  ctx.reply('👨‍💻 Bot ini dibuat dengan sistem Premium. Mendukung pelacakan resi real-time dengan UI Tree yang interaktif dan pendeteksi COD cerdas.');
});

bot.on('text', async (ctx) => {
  const textMsg = ctx.message.text.trim();
  if (textMsg.startsWith('/')) return;

  const parts = textMsg.split(/\s+/);
  if (parts.length < 2) {
    return ctx.reply('❗ *Format salah*\n\nContoh yang benar: \`spx SPX123456789\` atau \`jnt JP123456789\`', { parse_mode: 'Markdown' });
  }

  const courier = parts[0].toLowerCase();
  const waybill = parts[1];
  const number = parts[2];

  try {
    const loadingMsg = await ctx.reply('⏳ _Sistem sedang memproses data resi kamu..._', { parse_mode: 'Markdown' });

    const params = { api_key: API_KEY, courier, awb: waybill };
    if (number) params.number = number;

    const res = await axios.get('https://api.binderbyte.com/v1/track', { params });

    if (!res.data || !res.data.data) {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
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
    const amount = summary.amount || '';

    let paymentStatus = 'NON-COD / Lunas';
    if (amount && amount !== '0' && amount.toLowerCase() !== 'false') {
      const formattedCod = Number(amount).toLocaleString('id-ID');
      paymentStatus = `COD Rp. ${formattedCod},-`;
    } else if (isMarketplace) {
      paymentStatus = `Sistem Aplikasi (Bisa COD/Lunas)`;
    }

    const lastDate = history.length > 0 ? formatDate(history[0].date) : '-';
    const progressBar = getProgressBar(summary.status);

    let msg = `📦 *EKSPEDISI ${courier.toUpperCase()}*\n`;
    msg += `└ ${courierName}\n\n`;

    msg += `📩 *Informasi Resi*\n`;
    msg += `├ No Resi : ${awbClean}\n`;
    msg += `├ Layanan : ${service} (Berat: ${weight})\n`;
    msg += `└ Tipe    : ${paymentStatus}\n\n`;

    msg += `📮 *Status Pengiriman*\n`;
    msg += `├ ${statusText}\n`;
    msg += `├ ${lastDate}\n`;
    msg += `└ Progress: \`${progressBar}\`\n\n`; 

    msg += `📤 *Pengirim*\n`;
    msg += `├ Nama : ${shipper}\n`;
    msg += `└ Asal : ${origin}\n\n`;

    msg += `🚩 *Penerima*\n`;
    msg += `├ Nama   : ${receiver}\n`;
    msg += `└ Tujuan : ${destination}\n\n`;

    msg += `⏩ *POD Detail*\n`;

    if (history.length === 0) {
      msg += '└ 📭 Belum ada riwayat pengiriman.\n';
    } else {
      const fullHistory = [...history].reverse();
      fullHistory.forEach((h) => {
        const descClean = cleanData(h.desc);
        msg += `✅ ${descClean}\n`;
        msg += `└ ${formatDate(h.date)}\n`;
      });
    }

    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id).catch(() => {});
    ctx.reply(msg, { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('🗑️ Hapus Resi Ini', 'btn_delete_msg')]])
    });

  } catch (err) {
    console.error('Error tracking:', err.response?.data || err.message);
    let errorDetails = '';
    if (err.response && err.response.data && err.response.data.message) {
      errorDetails = `\n💬 *Pesan Sistem:* _${cleanData(err.response.data.message)}_`;
    }
    ctx.reply(
`❌ *Gagal melacak resi*

Kemungkinan penyebab:
- Nomor resi salah / belum terdaftar di sistem
- Kode kurir salah ketik
- Limit API telah habis${errorDetails}

Silakan periksa kembali resinya 🙏`,
      { parse_mode: 'Markdown' }
    );
  }
});

bot.action('btn_delete_msg', async (ctx) => {
  try {
    await ctx.deleteMessage();
    await ctx.answerCbQuery('Pesan resi dihapus 🗑️');
  } catch (error) {
    await ctx.answerCbQuery('Gagal menghapus pesan.');
  }
});

console.log('Menyiapkan bot dan web server...');
bot.launch().then(() => {
  console.log('bot ready di gunakan kakak, menyala abangkuh 🔥');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));