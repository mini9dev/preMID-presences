// Création d'une nouvelle instance de Presence avec l'ID client spécifié
const presence = new Presence({
    clientId: "1016797607370162256"
});

// Initialisation des données vidéo
let videoData: { currentTime: number; duration: number; paused: boolean } = {
    currentTime: 0,
    duration: 0,
    paused: true
};

// Écoute des données envoyées par l'iFrame
presence.on("iFrameData", (data: { currentTime: number; duration: number; paused: boolean }) => {  
    console.log("📌 Données reçues :", data);
    if (data?.duration) videoData = data;
});

// Fonction pour obtenir une URL d'image valide
async function getValidImageUrl(imageUrl: string | null): Promise<string> {
    // Si l'URL est invalide ou est un SVG, retourne l'image par défaut
    if (!imageUrl || imageUrl.startsWith("data:image/svg") || imageUrl.includes("<svg")) {
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp";
    }
    // Si l'URL commence par https, elle est déjà valide
    if (imageUrl.startsWith("https")) return imageUrl;

    // Sinon, construit l'URL complète et tente de la convertir en Base64
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
        console.error("⚠️ Erreur conversion Base64 :", error);
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp";
    }
}

// Mise à jour des données de présence
presence.on("UpdateData", async () => {
    // Récupération des paramètres de l'utilisateur
    const showTitle = await presence.getSetting<boolean>("privacy");
    const showButtons = await presence.getSetting<boolean>("buttons");
    const showTimestamps = await presence.getSetting<boolean>("timestamps");
    const showCover = await presence.getSetting<boolean>("cover");
    const showSeasonEpisode = await presence.getSetting<boolean>("season_episode");

    // Extraction du titre de la série
    const titleElement = document.querySelector("h1");
    let title = titleElement?.textContent?.trim() || "Série inconnue";

    // Analyse du titre pour extraire le nom de la série, la saison et l'épisode
    let match = title.match(/^(?:Série )?(.+?)(?: Saison (\d+))?(?: Episode (\d+))?(?: en Français)?$/);
    let seriesName = match ? match[1].trim() : title;
    let season = match && match[2] ? `Saison ${match[2]}` : "";
    let episode = match && match[3] ? `Épisode ${match[3]}` : "";
    let state = showSeasonEpisode ? (season && episode ? `${season} - ${episode}` : season || "") : "";

    // Récupération de l'URL de l'image
    let imageUrl = document.querySelector<HTMLImageElement>(".full_content-poster img")?.getAttribute("data-src") || "";
    const validImageUrl = await getValidImageUrl(imageUrl);

    // Si l'affichage du titre est désactivé, remplace le nom de la série
    if (!showTitle) {
        seriesName = "Regarde une série";
    }

    // Définition des icônes pour les différents états de lecture
    const playPauseIcons = {
        play: "https://cdn.rcd.gg/PreMiD/resources/play.png",
        pause: "https://cdn.rcd.gg/PreMiD/resources/pause.png",
        viewing: "https://cdn.rcd.gg/PreMiD/resources/viewing.png"
    };

    // Détermination de l'état de lecture
    const isInMenu = videoData.currentTime === 0 && videoData.duration === 0;
    let smallImageKey = isInMenu ? playPauseIcons.viewing : videoData.paused ? playPauseIcons.pause : playPauseIcons.play;
    let smallImageText = isInMenu ? "Navigue..." : videoData.paused ? "En pause" : "Lecture en cours";

    // Calcul des timestamps
    const [startTimestamp, endTimestamp] = presence.getTimestamps(videoData.currentTime, videoData.duration);

    // Construction des données de présence
    const presenceData: PresenceData = {
        type: ActivityType.Watching,
        details: seriesName,
        state: state,
        largeImageKey: showCover ? validImageUrl : "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp",
        smallImageKey: smallImageKey,
        smallImageText: smallImageText,
        largeImageText: "papadustream.day",
        startTimestamp: showTimestamps && !isInMenu && !videoData.paused ? startTimestamp : undefined,
        endTimestamp: showTimestamps && !isInMenu && !videoData.paused ? endTimestamp : undefined,
        buttons: showButtons ? [{ label: "Regarder", url: window.location.href }] : undefined
    };

    // Mise à jour de l'activité de présence
    presence.setActivity(presenceData);
});
