async function updateDiscordStats() {
    try {
        const apiUrl = (window.NIGHTLIFE_API_URL || 'https://backend-c5xeyazdn-efeomer019-8833s-projects.vercel.app/api').replace(/\/$/, '');
        const response = await fetch(`${apiUrl}/discord-stats`);
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
