// 🛠️ Création d'une nouvelle instance de Presence avec l'ID client Discord
const presence = new Presence({
    clientId: "1334233492955070506"
});

// ⚙️ Initialisation des données vidéo
let videoData: { currentTime: number; duration: number; paused: boolean } = {
    currentTime: 0,
    duration: 0,
    paused: true
};

// 📦 Cache pour éviter de recharger les mêmes images plusieurs fois
const imageCache: { [key: string]: string } = {};

// 👂 Écoute des données envoyées par l'iFrame
presence.on("iFrameData", (data: { currentTime: number; duration: number; paused: boolean }) => {  
    console.log("📌 Données reçues :", data);
    if (data?.duration) videoData = data;
});

// 🧩 Fonction pour obtenir une URL d'image valide (Base64 ou HTTPS)
async function getValidImageUrl(imageUrl: string | null): Promise<string> {
    if (!imageUrl || imageUrl.startsWith("data:image/svg") || imageUrl.includes("<svg")) {
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp"; // Image par défaut
    }
    if (imageUrl.startsWith("https")) return imageUrl;

    if (imageCache[imageUrl]) {
        console.log("📌 Image chargée depuis le cache:", imageUrl);
        return imageCache[imageUrl];
    }

    const fullUrl = `https://papadustream.day${imageUrl}`;
    try {
        console.time("Fetch Image");
        const response = await fetch(fullUrl);
        console.timeEnd("Fetch Image");

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                imageCache[imageUrl] = reader.result as string; // Ajout au cache
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("⚠️ Erreur conversion Base64 :", error);
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp";
    }
}

// 🔍 Détection du type de page (menu, série, saison, épisode)
function getPageType(): string {
    const url = window.location.pathname;
    const segments = url.split("/").filter(Boolean); // Supprime les segments vides

    if (segments.length === 0) return "menu";
    if (segments.length === 2) return "serie";
    if (segments.length === 3) return "saison";
    if (segments.length === 4) return "episode";

    return "inconnu";
}

// 🧩 Fonction principale pour mettre à jour la présence Discord
async function updatePresence() {
    console.time("Update Presence");

    // 🔄 Récupération des paramètres de l'extension PreMiD
    const showTitle = await presence.getSetting<boolean>("privacy");
    const showTimestamps = await presence.getSetting<boolean>("timestamps");
    const showCover = await presence.getSetting<boolean>("cover");
    const showSeasonEpisode = await presence.getSetting<boolean>("season_episode");
    const showButtons = await presence.getSetting<boolean>("buttons"); // ✅ Récupération du réglage "Show Buttons"

    // 🔍 Récupération du titre
    const titleElement = document.querySelector("h1");
    let title = titleElement?.textContent?.trim() || "Série inconnue";

    // 🔍 Extraction des infos (série, saison, épisode)
    let match = title.match(/^(?:Série )?(.+?)(?: Saison (\d+))?(?: Episode (\d+))?(?: en Français)?$/);
    let seriesName = match ? match[1].trim() : title;
    let season = match && match[2] ? `Saison ${match[2]}` : "";
    let episode = match && match[3] ? `Épisode ${match[3]}` : "";
    let state = showSeasonEpisode ? (season && episode ? `${season} - ${episode}` : season || "") : "";

    // 🔍 Détection du type de page
    const pageType = getPageType();
    
    // 🛠️ Gestion de l'affichage du titre selon les réglages
    if (!showTitle) {
        seriesName = (pageType === "menu") ? "Dans le menu" : "Regarde une série";
    }

    // 🔄 Récupération de l'image de la série
    let imageUrl = document.querySelector<HTMLImageElement>(".full_content-poster img")?.getAttribute("data-src") || "";
    const validImageUrl = await getValidImageUrl(imageUrl);

    // 🎭 Icônes Play/Pause/Menu
    const playPauseIcons = {
        play: "https://cdn.rcd.gg/PreMiD/resources/play.png",
        pause: "https://cdn.rcd.gg/PreMiD/resources/pause.png",
        viewing: "https://cdn.rcd.gg/PreMiD/resources/viewing.png"
    };

    // ✔️ Sélection de l'icône Play/Pause/Menu
    const isInMenu = pageType === "menu";
    let smallImageKey = isInMenu ? playPauseIcons.viewing : (videoData.paused ? playPauseIcons.pause : playPauseIcons.play);
    let smallImageText = isInMenu ? "Navigue..." : (videoData.paused ? "En pause" : "Lecture en cours");

    // ⏳ Récupération des timestamps
    const [startTimestamp, endTimestamp] = presence.getTimestamps(videoData.currentTime, videoData.duration);

    // 🎯 Construction de l'objet PresenceData
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
        // 📌 Ajout du bouton seulement si "Show Buttons" est activé
        buttons: showButtons && !isInMenu ? [{ label: "Regarder sur PapaDuStream", url: window.location.href }] : undefined
    };

    // ✅ Mise à jour de la présence Discord
    presence.setActivity(presenceData);
    console.timeEnd("Update Presence");
}

// 🔄 Exécuter la mise à jour des données à chaque changement
presence.on("UpdateData", updatePresence);
