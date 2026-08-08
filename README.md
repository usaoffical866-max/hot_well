# HotWell — Telegram Mini App

**Play • Collect Points • Win Rewards**

HotWell is a Telegram Mini App built with vanilla JavaScript that provides an engaging gaming experience with mini-games, daily tasks, leaderboards, and point collection—all in demo mode within Telegram.

## ✨ Features

### 🎮 Mini Games
- **🎰 Slots** — Classic slot machine game (50 points per win)
- **🎯 Dart** — Dart throwing game (30 points per win)
- **🎲 Dice** — Dice rolling game (20 points per win)
- **🎪 Spin** — Fortune wheel spin (40 points per win)

### 📋 Daily Tasks
- **Daily Login** — Earn 10 coins (auto-completed)
- **Invite Friends** — Earn 50 coins
- **Share Story** — Earn 25 coins
- **Watch Ad** — Earn 5 coins

### 🏆 Leaderboard
Track your rank against other players with a competitive leaderboard system.

### 👤 User Profile
- Display user stats (level, coins, points, rewards)
- Share profile via Telegram
- Avatar integration from Telegram user data

### 🎁 Rewards System
- Earn coins by playing games and completing tasks
- Daily bonus claims (50 coins)
- Point accumulation for level progression

## 🔬 Demo Mode

All gameplay is **simulated in demo mode**. No real transactions or backend integration yet. Perfect for prototyping and testing the UI/UX.

**Important:** The app currently demonstrates features without persistent storage. When you close and reopen, the session resets.

## 📁 Project Structure

```
hot_well/
├── index.html        # Main HTML entry point
├── style.css         # Styling (dark theme, responsive design)
├── app.js            # Core app logic & page rendering
└── README.md         # This file
```

### Key Files Explained

- **index.html** — Defines the app structure with header, navigation, and content area
- **style.css** — Comprehensive styling with CSS variables for theming, glassmorphism effects, and responsive layout
- **app.js** — Handles all state management, page rendering, game logic, and Telegram WebApp integration

## 🚀 How to Run

### Local Development with Python HTTP Server

1. **Navigate to the repository directory:**
   ```bash
   cd hot_well
   ```

2. **Start a simple HTTP server:**
   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

3. **Open your browser:**
   ```
   http://localhost:8000
   ```

4. **For Telegram testing:** Use the Telegram Bot API to test the Mini App with ngrok or similar tunneling service to expose your local server.

### Telegram Integration

The app automatically detects if it's running inside Telegram using the WebApp API:

```javascript
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}
```

If running outside Telegram, the app operates in demo mode with simulated user data.

## 🔐 Security Warning

⚠️ **NEVER expose Telegram bot tokens in client-side code!**

- Keep all sensitive credentials on your backend server
- Use secure server-to-server communication for payment processing
- Never hardcode API keys in JavaScript files
- Implement proper authentication before accepting user actions

## 🔜 Future Backend Integration

This demo is designed to easily connect to a backend. Future enhancements will include:

- **Database** — Persistent user accounts, achievements, and leaderboards
- **Backend API** — Secure communication for game results, task validation, and rewards
- **Payment Gateway** — Real transaction processing (if applicable)
- **WebSocket** — Real-time leaderboard updates and notifications
- **Bot Integration** — Telegram Bot API for notifications and verification

### Example Backend Integration Points

- `POST /api/game/play` — Submit game results
- `POST /api/tasks/complete` — Mark tasks as done
- `GET /api/leaderboard` — Fetch live rankings
- `POST /api/rewards/claim` — Claim daily bonuses

## 🛠️ Technology Stack

- **HTML5** — Semantic structure and WebApp API integration
- **CSS3** — Modern styling with gradients, glassmorphism, and responsive design
- **Vanilla JavaScript** — No dependencies, lightweight and fast
- **Telegram WebApp API** — Native integration with Telegram Mini Apps

## 📝 License

This project is open source and available for modification and educational use.

---

**Status:** Demo Mode (No Real Transactions)  
**Last Updated:** August 2026  
**Repository:** usaoffical866-max/hot_well
