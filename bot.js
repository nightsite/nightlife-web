require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const GUILD_ID = '1484355460864802978';
const RENDER_API = 'https://nightlife-backend-vijo.onrender.com/api';

// Geheimer Key damit nur dein Bot die Stats pushen kann
// Muss in der .env auf Pebblehost UND Render gleich sein!
const PUSH_SECRET = process.env.PUSH_SECRET || 'nightlife-secret-2026';

async function pushStats() {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.log('⚠️ Guild nicht gefunden');
            return;
        }

        await guild.members.fetch();

        const total = guild.memberCount;
        const online = guild.members.cache.filter(m =>
            m.presence && m.presence.status !== 'offline'
        ).size;
        const voice = guild.members.cache.filter(m =>
            m.voice.channelId !== null
        ).size;
        const offline = total - online;

        const response = await fetch(`${RENDER_API}/push-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-push-secret': PUSH_SECRET
            },
            body: JSON.stringify({ total, online, voice, offline })
        });

        const data = await response.json();
        if (data.success) {
            console.log(`✅ Stats gepusht — Online: ${online} | Voice: ${voice} | Total: ${total}`);
        } else {
            console.log('❌ Push fehlgeschlagen:', data.error);
        }

    } catch (err) {
        console.error('❌ Fehler beim Pushen:', err.message);
    }
}

client.once('ready', () => {
    console.log(`🤖 Bot online als: ${client.user.tag}`);

    // Sofort beim Start pushen, dann alle 60 Sekunden
    pushStats();
    setInterval(pushStats, 60 * 1000);
});

// Stats neu pushen wenn jemand den Voice-Status ändert
client.on('voiceStateUpdate', () => pushStats());

// Stats neu pushen wenn jemand den Online-Status ändert
client.on('presenceUpdate', () => pushStats());

client.login(process.env.DISCORD_TOKEN);