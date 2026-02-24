🎯 抽值日生輪盤/ Duty Wheel Assignment System

Stable Version: v3.0
Author作者: Anderson Lee
Last Update最後更新日: 2026-02-11

📌 專案介紹/ Project Overview
「抽值日生輪盤」是一個純前端的互動抽籤系統，專為班級、教會、團隊輪值設計。
The Duty Wheel is a pure front-end interactive assignment system designed for class duty rotation, church ministry scheduling, and team task distribution.

系統特點包括/ Key features include:
🔵 INIT 藍色圓預設畫面/ Blue INIT default circle state

🖱 手動 / ⚡ 自動模式; 🖱 Manual / ⚡ Auto modes

🔁 日期不可重複/ No duplicate date assignment

🔄 人員抽完自動重置/ Member pool auto-reset

💾 localStorage 記憶輸入/ localStorage persistence

📊 一鍵匯出 Excel (.xlsx)/ One-click Excel export

✋ 自動模式可中途打斷/ Auto mode interruptable

✨ 手動模式金色高亮閃爍/ Golden blinking highlight in manual mode


🧠 系統邏輯架構/ System Flow Architecture
1️⃣ INIT
未鎖定名單時顯示藍色圓/ Blue circle displayed before locking the list.

2️⃣ READY_MEMBER
鎖定後可抽值日生/ Ready to spin member wheel.

3️⃣ READY_DATE
抽中值日生後可抽日期/ Ready to spin date wheel.

4️⃣ FINISHED
所有日期完成後啟用 Excel 下載/ Excel export enabled after all dates are assigned.

🎮 操作模式
🎮 Operation Modes
🖱 手動模式 Manual Mode

流程 Flow:
抽值日生 → 抽日期
Spin Member → Spin Date

特性 Features:
*金色閃爍高亮/ Golden blinking highlight
*有音效/ Sound effects enabled
高亮保留至下一輪/ Highlight persists until next spin

⚡ 自動模式 Auto Mode
*一鍵完成全部分配/ Complete full assignment automatically
*無閃爍/ No blinking highlight
*靜音/ Silent mode
*可隨時中斷/ Interruptable anytime

🔁 抽取規則/ Assignment Rules
項目,	規則,	    Rule
日期,	不可重複,	    Dates never repeat
值日生,	用完自動重置,	Member pool resets after full round
完成條件,	日期全部抽完,	Finish when all dates assigned

💾 localStorage 支援/ localStorage Support

自動儲存/ Automatically stores:
duty_dates
duty_members

重新整理後仍保留輸入/ Inputs remain after page refresh.

按「重置」會清除資料/ Reset clears localStorage.

📊 匯出功能/ Export Feature
📁 Excel (.xlsx) Export
*使用 SheetJS (xlsx.full.min.js)
*自動設定欄寬
*中文不亂碼
*UTF-8 完整支援

欄位 Columns:
| 時間 Time | 模式 Mode | 值日生 Member | 日期 Date |

🛠 技術架構/ Technical Stack

*HTML5
*CSS3 (Modern Card UI)
*Vanilla JavaScript
*Canvas 2D API
*requestAnimationFrame Animation
*State Machine Architecture
*Set() for uniqueness control
*SheetJS for Excel export

🔐 音效機制/ Audio Mechanism

*手動模式才播放/ Sound plays only in manual mode
*自動模式靜音/ Auto mode muted
*手機需先解鎖音效/ Mobile requires audio unlock

🎨 視覺特色/ UI Features
*INIT 藍色圓/ Blue initial state
*灰化已抽項目/ Grayed used slices
*金色高亮外框/ Golden highlight border
*閃爍動畫/ Blink animation
*RWD 響應式設計/ Responsive design

📂 專案結構/ Project Structure
index.html
audio/
  drum.mp3
  dun.mp3

CDN:
https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js

🚀 使用方式/ How to Use

1.輸入值日生名單/ Enter member list

2.輸入日期/ Enter date list

3.點「鎖定名單」/ Click Lock

4.手動或自動抽取/ Run Manual or Auto mode

5.完成後匯出 Excel/ Export Excel after finish

📈 未來擴充/ Future Enhancements
*多班級管理/ Multi-group management
*日期自動生成/ Auto date generator
*Dark mode
*統計分析圖表/ Statistics dashboard
*衝突檢測/ Conflict detection