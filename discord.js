async function updateDiscordStats() {
    try {
        // HIER DEINE RENDER-URL EINTRAGEN:
        const response = await fetch('https://nightlife-backend-vijo.onrender.com/api/discord-stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('stat-total').innerText = data.total;
            document.getElementById('stat-online').innerText = data.online;
            document.getElementById('stat-voice').innerText = data.voice;
            document.getElementById('stat-offline').innerText = data.offline;
        }
    } catch (error) {
        console.error("Konnte Stats vom Backend nicht laden:", error);
    }
}

updateDiscordStats();
setInterval(updateDiscordStats, 60000);
