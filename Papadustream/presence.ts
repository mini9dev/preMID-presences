const presence = new Presence({
    clientId: "1016797607370162256"
});

let videoData: { currentTime: number; duration: number; paused: boolean } = {
    currentTime: 0,
    duration: 0,
    paused: true
};

// 🔄 Mise à jour des données vidéo depuis l'iframe
presence.on("iFrameData", (data: { currentTime: number; duration: number; paused: boolean }) => {  
    console.log("📌 Données reçues de l'iframe :", data);
    if (data?.duration) videoData = data;
});

// 🔄 Fonction pour obtenir une image correcte (Base64 ou HTTPS)
async function getValidImageUrl(imageUrl: string | null): Promise<string> {
    if (!imageUrl || imageUrl.startsWith("data:image/svg") || imageUrl.includes("<svg")) {
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp"; // Image par défaut
    }

    if (imageUrl.startsWith("https")) {
        return imageUrl; // ✅ Garder les images HTTPS normales
    }

    // Ajout du domaine si l'URL est relative
    const fullUrl = `https://papadustream.day${imageUrl}`;

    try {
        const response = await fetch(fullUrl);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("⚠️ Erreur lors de la conversion en Base64 :", error);
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp"; // Image par défaut en cas d'erreur
    }
}

// 🎮 Création de l'objet PresenceData
presence.on("UpdateData", async () => {
    const titleElement = document.querySelector("h1");
    let title = titleElement?.textContent?.trim() || "Série inconnue";

    // 🔍 Extraction du vrai nom de la série sans l'année ni "en Français"
    let match = title.match(/^(?:Série )?(.+?)(?: Saison (\d+))?(?: Episode (\d+))?(?: en Français)?$/);
    let seriesName = match ? match[1].trim() : title;

    // 🔍 Détection de la saison et de l'épisode
    let season = match && match[2] ? `Saison ${match[2]}` : "";
    let episode = match && match[3] ? `Épisode ${match[3]}` : "";

    // ✅ Correction de l'affichage
    let state = season && episode ? `${season} - ${episode}` : season || "";

    let imageUrl = document.querySelector<HTMLImageElement>(".full_content-poster img")?.getAttribute("data-src") || "";
    const validImageUrl = await getValidImageUrl(imageUrl);

    // 📌 Ajout des icônes Play/Pause/Menu
    const playPauseIcons = {
        play: "https://cdn.rcd.gg/PreMiD/resources/play.png",
        pause: "https://cdn.rcd.gg/PreMiD/resources/pause.png",
        viewing: "https://cdn.rcd.gg/PreMiD/resources/viewing.png"
    };

    // 🔍 Détection si on est dans le menu (aucune vidéo en cours)
    const isInMenu = videoData.currentTime === 0 && videoData.duration === 0;

    // 🔄 Sélection de l'icône et du texte au survol
    let smallImageKey = isInMenu 
        ? playPauseIcons.viewing // 🆕 Icône "Viewing" si on est dans le menu
        : videoData.paused ? playPauseIcons.pause : playPauseIcons.play; // Sinon, pause/play

    let smallImageText = isInMenu 
        ? "Navigue..." // 🆕 Texte "Navigue..." si on est dans le menu
        : videoData.paused ? "En pause" : "Lecture en cours";

    // ⏳ Récupération des timestamps pour la barre de progression
    const [startTimestamp, endTimestamp] = presence.getTimestamps(videoData.currentTime, videoData.duration);

    // 📌 Construction de l'objet PresenceData
    const presenceData: PresenceData = {
        type: ActivityType.Watching,
        details: seriesName,
        state: state,
        largeImageKey: validImageUrl,
        smallImageKey: smallImageKey, // ✅ Icône dynamique
        smallImageText: smallImageText, // ✅ Texte dynamique
        startTimestamp: isInMenu || videoData.paused ? undefined : startTimestamp,
        endTimestamp: isInMenu || videoData.paused ? undefined : endTimestamp,
    };

    // ✅ Mise à jour de la présence sur Discord
    presence.setActivity(presenceData);
});
