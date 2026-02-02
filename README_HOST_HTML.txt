# Host 子目錄 HTML（直接可用）

你目前 repo 出現「host/host」重複層級：請只保留一層。

✅ 正確：/host/index.html、/host/viewer.html、/host/js/*  
❌ 錯誤：/host/host/...

## 這份 HTML 放置位置
- `host/index.html`：主持機
- `host/viewer.html`：參與者端（唯讀存圖）
- `host/js/*`：模組 JS（你已經在 /host/js/ commit 了 4 支）

## 資源放哪裡
此版本預設資源仍在 repo root：
- `../logo3524.png`
- `../audio/drum.mp3`、`../audio/win.mp3`
- `../cards/001.png ...`

所以不用搬 `cards/`，也不用搬 `audio/`。

## 入口檔
index.html 目前寫死入口：`./js/boot.js`  
若你的入口不是 boot.js（例如你是 main.js），把這行改成 `./js/main.js` 即可。
