const serverId = '1484355460864802978'; 

async function zeigeOnlineZahlen() {
    try {
        const url = `https://discord.com/api/guilds/${serverId}/widget.json`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');
        
        const data = await response.json();
        
        // Greift sich dein neongrünes Element aus der index.html
        const onlineElement = document.getElementById('stat-online');
        
        if (onlineElement) {
            // Tauscht die statische "28" gegen die echten Live-Zahlen aus
            onlineElement.innerText = data.presence_count;
        }
        
    } catch (error) {
        console.error("Fehler beim Laden der Discord-Daten:", error);
        // Falls die API blockiert oder der Server offline ist
        document.getElementById('stat-online').innerText = "OFF";
    }
}

// Sofort beim Laden ausführen
zeigeOnlineZahlen();

// Alle 60 Sekunden aktualisieren, damit es immer live bleibt
setInterval(zeigeOnlineZahlen, 60000);