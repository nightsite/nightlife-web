async function updateDiscordStats() {
    try {
        // Wir rufen jetzt nicht mehr Discord an, sondern unser EIGENES Backend!
        const response = await fetch('http://localhost:3000/api/discord-stats');
        const data = await response.json();
        
        // Wenn das Backend erfolgreich geantwortet hat, füllen wir alle 4 Felder:
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

// Sofort beim Laden der Website ausführen
updateDiscordStats();

// Alle 60 Sekunden updaten (damit die Zahlen live bleiben)
setInterval(updateDiscordStats, 60000);