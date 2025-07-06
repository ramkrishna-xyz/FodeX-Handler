
# FodeX Handler - Advanced Discord.js Bot Framework

![Banner](https://raw.githubusercontent.com/ramkrishna-xyz/FodeX-Handler/main/assets/banner.png)

An all-in-one, feature-packed Discord.js v14.19.3 bot handler designed for scalability and ease of use.

## ✨ Features

### Core Architecture
- 🏗️ Modular feature-based structure
- 🧩 Multiple handler systems (commands, events, interactions)
- 🛠️ Extended Discord.js classes with additional functionality

### Built-in Systems
| System          | Description                          |
|-----------------|--------------------------------------|
| 🛡️ Moderation   | Advanced tools for server management |
| 💰 Economy      | Currency, shops, and jobs system    |
| 🎵 Music        | High-quality audio playback         |
| 📈 Leveling     | XP system with rewards              |
| 🎫 Tickets      | Support ticket system               |
| ⭐ Starboard    | Message highlighting system         |
| 🎉 Giveaways    | Customizable giveaways              |
| ⏰ Reminders    | Scheduled reminders                 |
| 🤖 Auto-Mod     | Automatic rule enforcement          |

### Additional Features
- 🌐 Web dashboard with real-time controls
- 🗃️ MongoDB + Redis database support
- 🔒 Advanced permission system
- 🌍 i18n multi-language support
- 📊 Extensive logging system

## 🚀 Quick Start

### Prerequisites
- Node.js v16.9.0 or higher
- MongoDB database
- Redis server (optional but recommended)

### Installation
```bash
# Clone the repository
git clone https://github.com/ramkrishna-xyz/FodeX-Handler.git
cd fodex-handler

# Install dependencies
npm install

# Set up environment
cp .env.example .env
```

### Configuration
Edit the `.env` file:
```env
DISCORD_TOKEN=your_bot_token
MONGO_URI=mongodb://localhost:27017/fodex-bot
REDIS_URI=redis://localhost:6379  # Optional
DASHBOARD_SECRET=your_secret_key
DASHBOARD_PORT=3000
```

## 🛠️ Usage

```bash
# Start bot normally
npm start

# Development mode (auto-restart)
npm run dev

# Deploy slash commands
npm run deploy

# Start with dashboard
npm run start:dashboard
```

## 📂 Project Structure

```
fodex-handler/
├── src/
│   ├── bot.js                 # Main entry point
│   ├── config.js              # Configuration
│   ├── handlers/              # Handler systems
│   │   ├── CommandHandler.js
│   │   ├── EventHandler.js
│   │   ├── InteractionHandler.js
│   │   ├── DatabaseHandler.js
│   │   └── FeatureHandler.js
│   ├── structures/            # Extended classes
│   ├── utils/                 # Utilities
│   ├── commands/              # Command files
│   ├── events/                # Event files
│   ├── interactions/          # Interaction components
│   ├── features/              # Feature modules
│   └── dashboard/             # Web dashboard
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## 💻 Creating a Command

```javascript
// commands/utility/ping.js
const Command = require('../../structures/Command');

module.exports = class PingCommand extends Command {
    constructor() {
        super({
            name: 'ping',
            description: 'Check bot latency',
            category: 'Utility',
            cooldown: 5000,
            slashCommand: true,
            slashData: {
                name: 'ping',
                description: 'Check bot latency'
            }
        });
    }

    async execute(message, args, client) {
        const msg = await message.reply('Pinging...');
        const latency = msg.createdTimestamp - message.createdTimestamp;
        msg.edit(`🏓 Pong!\nBot: ${latency}ms\nAPI: ${client.ws.ping}ms`);
    }

    async runSlash(interaction, client) {
        await interaction.reply('Pinging...');
        const reply = await interaction.fetchReply();
        const latency = reply.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`🏓 Pong!\nBot: ${latency}ms\nAPI: ${client.ws.ping}ms`);
    }
};
```

## 🌐 Web Dashboard

![Dashboard Preview](https://raw.githubusercontent.com/ramkrishna-xyz/FodeX-Handler/main/assets/dashboard-preview.png)

Access the dashboard at `http://localhost:3000` after starting with:
```bash
npm run start:dashboard
```

Features include:
- Real-time server statistics
- Command management
- Moderation controls
- Economy configuration
- User management

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Ramkrishna - [@ramkrishna_xyz](https://twitter.com/ramkrishna_xyz)  
Project Link: [https://github.com/ramkrishna-xyz/FodeX-Handler](https://github.com/ramkrishna-xyz/FodeX-Handler)

## ✨ Support

Give a ⭐️ if you like this project!

---

**FodeX Handler** - The ultimate framework for building powerful Discord bots with Discord.js v14.19.3
