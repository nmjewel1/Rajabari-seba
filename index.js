
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcome = `🌟 স্বাগতম রাজবাড়ী জেলা সেবা বটে 🌟

আপনি নিচের কমান্ডগুলো ব্যবহার করতে পারেন:
🩸 /blood [গ্রুপ] ➤ রক্তদাতা তালিকা
🚑 /ambulance ➤ এম্বুলেন্স তালিকা
🏥 /hospital ➤ হাসপাতাল ও ক্লিনিক
👨‍⚕️ /doctor ➤ ডাক্তারদের তথ্য
👮 /police ➤ পুলিশ হটলাইন
🔥 /fire ➤ ফায়ার সার্ভিস
📦 /delivery ➤ কুরিয়ার সার্ভিস
🍴 /restaurant ➤ হোটেল-রেস্টুরেন্ট
💊 /pharmacy ➤ ফার্মেসী
⚡ /electricity ➤ বিদ্যুৎ অফিস
📞 /help ➤ সাহায্য`;

  bot.sendMessage(chatId, welcome);
});

bot.onText(/\/blood (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const bloodGroup = match[1].trim().toUpperCase();
  const snapshot = await db.ref('BloodDonor').once('value');
  const data = snapshot.val();
  let result = `🩸 *${bloodGroup} গ্রুপের রক্তদাতা:*

`, found = false;
  for (const key in data) {
    if (data[key].Blood === bloodGroup) {
      found = true;
      result += `👤 ${data[key].Name}\n📞 ${data[key].Phone}\n📍 ${data[key].Address}\n\n`;
    }
  }
  if (!found) result = `❌ ${bloodGroup} গ্রুপের কোন তথ্য পাওয়া যায়নি।`;
  bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
});

const generateList = async (ref, title, formatter) => {
  const snapshot = await db.ref(ref).once('value');
  const data = snapshot.val();
  let text = `📋 *${title} তালিকা:*

`;
  for (const key in data) text += formatter(data[key]);
  return text;
};

bot.onText(/\/ambulance/, async (msg) => {
  const text = await generateList('Ambulance', 'এম্বুলেন্স', d => `🚑 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/hospital/, async (msg) => {
  const text = await generateList('Hospital', 'হাসপাতাল ও ক্লিনিক', d => `🏥 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/doctor/, async (msg) => {
  const text = await generateList('Doctor', 'ডাক্তারের তথ্য', d => `👨‍⚕️ ${d.Name}\n📞 ${d.Phone}\n🏥 ${d.Mbbs}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/police/, async (msg) => {
  const text = await generateList('Police', 'পুলিশ হটলাইন', d => `👮 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/fire/, async (msg) => {
  const text = await generateList('Firefighter', 'ফায়ার সার্ভিস', d => `🔥 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/delivery/, async (msg) => {
  const text = await generateList('Delivery', 'কুরিয়ার সার্ভিস', d => `📦 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/restaurant/, async (msg) => {
  const text = await generateList('Restaurant', 'রেস্টুরেন্ট', d => `🍴 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/pharmacy/, async (msg) => {
  const text = await generateList('Pharmacy', 'ফার্মেসী', d => `💊 ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/electricity/, async (msg) => {
  const text = await generateList('Electricity', 'বিদ্যুৎ অফিস', d => `⚡ ${d.Name}\n📞 ${d.Phone}\n📍 ${d.Address}\n\n`);
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});


// /notice command (read from Firebase 'Notice' node)
bot.onText(/\/notice/, async (msg) => {
  const chatId = msg.chat.id;
  const snapshot = await db.ref('Notice').once('value');
  const data = snapshot.val();

  if (!data) return bot.sendMessage(chatId, '📢 বর্তমানে কোনো নোটিশ পাওয়া যায়নি।');

  let text = '📢 *সাম্প্রতিক নোটিশ:*

';
  for (const key in data) {
    text += `📝 ${data[key].title || 'শিরোনাম নেই'}\n${data[key].message || ''}\n📅 ${data[key].date || ''}\n\n`;
  }

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// /admin command (only for admin users)
const adminIDs = ['7790579006']; // Replace with your Telegram user ID

bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '❌ আপনি এই কমান্ড ব্যবহার করার অনুমতি পাননি।');
  }

  const text = `🛠️ অ্যাডমিন অপশনসমূহ:
/notice ➤ সর্বশেষ নোটিশ দেখুন
(ভবিষ্যতে এড, ডিলিট অপশন যুক্ত হবে)`;

  bot.sendMessage(chatId, text);
});


// Admin: /admin addnotice <title>|<message>|<date>
bot.onText(/\/admin addnotice (.+)/, async (msg, match) => {
  const userId = msg.from.id.toString();
  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(msg.chat.id, '❌ আপনি এই কমান্ড ব্যবহার করার অনুমতি পাননি।');
  }

  const parts = match[1].split('|');
  if (parts.length < 3) {
    return bot.sendMessage(msg.chat.id, '⚠️ সঠিক ফরম্যাট: /admin addnotice শিরোনাম|বার্তা|তারিখ');
  }

  const [title, message, date] = parts.map(p => p.trim());
  const newRef = db.ref('Notice').push();
  await newRef.set({ title, message, date });

  bot.sendMessage(msg.chat.id, '✅ নতুন নোটিশ সংরক্ষণ করা হয়েছে।');
});

// Admin: /admin deletenotice <id>
bot.onText(/\/admin deletenotice (.+)/, async (msg, match) => {
  const userId = msg.from.id.toString();
  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(msg.chat.id, '❌ আপনি এই কমান্ড ব্যবহার করার অনুমতি পাননি।');
  }

  const noticeId = match[1].trim();
  try {
    await db.ref(`Notice/${noticeId}`).remove();
    bot.sendMessage(msg.chat.id, `🗑️ নোটিশ ${noticeId} ডিলিট করা হয়েছে।`);
  } catch (error) {
    bot.sendMessage(msg.chat.id, `❌ ডিলিট করতে সমস্যা হয়েছে: ${error.message}`);
  }
});
