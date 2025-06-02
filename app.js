require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot 設定
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error('錯誤：請設定 BOT_TOKEN 和 WEBHOOK_URL 環境變數');
  process.exit(1);
}

app.use(express.json());
app.use(express.static('public'));

// 設定 webhook
async function setupWebhook() {
  try {
    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            url: `${WEBHOOK_URL}/webhook`,
            allowed_updates: ['message']
          })
        });

    const result = await response.json();
    console.log('Webhook 設定:', result.ok ? '成功' : result.description);
  } catch (error) {
    console.error('設定 webhook 錯誤:', error.message);
  }
}

// 驗證
function verifyTelegramWebAppData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(
        BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(
        dataCheckString).digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('驗證錯誤:', error);
    return false;
  }
}

// Webhook 路由
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    console.log('收到訊息:\n', JSON.stringify(update, null, 2));

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      if (text === '/start') {
        const keyboard = {
          inline_keyboard: [[
            {
              text: '開啟 Web App',
              web_app: {url: `${WEBHOOK_URL}/webapp`}
            }
          ]]
        };
        return res.status(200).json({
          method: 'sendMessage',
          chat_id: chatId,
          text: '點擊下方按鈕開啟 Web App',
          reply_markup: keyboard
        });
      } else if (text === '/help') {
        const helpMessage = `/start - 顯示 Web App 按鈕\n/help - 顯示此說明`;
        return res.status(200).json({
          method: 'sendMessage',
          chat_id: chatId,
          text: helpMessage
        });
      } else {
        return res.status(200).json({
          method: 'sendMessage',
          chat_id: chatId,
          text: `Echo：${text}\n\n可輸入 /help 查看可用指令`
        });
      }
    }

    res.status(200).json({ok: true});
  } catch (error) {
    console.error('Webhook 錯誤:', error);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

// Web App 頁面
app.get('/webapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'webapp.html'));
});

// API 驗證路由
app.post('/api/verify', (req, res) => {
  try {
    const {initData} = req.body;

    if (!initData) {
      return res.status(400).json({error: '缺少 initData'});
    }

    const isValid = verifyTelegramWebAppData(initData);

    if (!isValid) {
      return res.status(401).json({error: '驗證失敗'});
    }

    // 解析使用者資料
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    const user = userStr ? JSON.parse(userStr) : null;

    res.json({
      success: true,
      user: user,
      data: Object.fromEntries(urlParams)
    });

  } catch (error) {
    console.error('驗證錯誤:', error);
    res.status(500).json({error: '伺服器錯誤'});
  }
});

async function startServer() {
  await setupWebhook();

  app.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}/webhook`);
    console.log(`Web App URL: ${WEBHOOK_URL}/webapp`);
  });
}

startServer();

module.exports = app;