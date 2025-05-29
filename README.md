## 功能

- Web App 資料檢視
- 資料驗證
- JSON和原始資料複製功能

## 安裝

1. 下載專案：
    ```bash
    git clone https://github.com/garry-luo/telegram-bot-webapp.git
    ```
2. 安裝依賴套件：

   ```bash
   npm install express dotenv
   ```

## 設定

1. 可選，使用[ngrok](https://ngrok.com/)取得公開網址，自行註冊
    1. 安裝ngrok
       ```bash
       brew install ngrok
       ```
    2. 設定ngrok授權
       ```bash
       ngrok config add-authtoken [你的ngrok授權碼]
       ```
    3. 開啟ngrok
       ```bash
       ngrok http 3000
       ```
    4. 複製顯示的 https 網址（例如：https://abc123.ngrok-free.app）

2. 設定 `.env`
   ```text
   BOT_TOKEN=你的TelegramBotToken
   WEBHOOK_URL=https://abc123.ngrok-free.app
   PORT=你開啟的port
   ```

## 執行

1. 啟動程式
   ```bash
   node app.js
   ```
