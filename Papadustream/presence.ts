const presence = new Presence({
    clientId: "1016797607370162256"
});

let videoData: { currentTime: number; duration: number; paused: boolean } = {
    currentTime: 0,
    duration: 0,
    paused: true
};

presence.on("iFrameData", (data: { currentTime: number; duration: number; paused: boolean }) => {  
    console.log("📌 Données reçues :", data);
    if (data?.duration) videoData = data;
});

async function getValidImageUrl(imageUrl: string | null): Promise<string> {
    if (!imageUrl || imageUrl.startsWith("data:image/svg") || imageUrl.includes("<svg")) {
        return "https://papasdustream.com/wp-content/uploads/2024/10/cropped-logo-papadustream.jpg.webp";
    }
    if (imageUrl.startsWith("https")) return imageUrl;

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

presence.on("UpdateData", async () => {
    const showTitle = await presence.getSetting<boolean>("privacy"); // 🆕 Remplacé par "Show Title"
    const showButtons = await presence.getSetting<boolean>("buttons");
    const showTimestamps = await presence.getSetting<boolean>("timestamps");
    const showCover = await presence.getSetting<boolean>("cover");
    const showSeasonEpisode = await presence.getSetting<boolean>("season_episode");

    const titleElement = document.querySelector("h1");
    let title = titleElement?.textContent?.trim() || "Série inconnue";

    let match = title.match(/^(?:Série )?(.+?)(?: Saison (\d+))?(?: Episode (\d+))?(?: en Français)?$/);
    let seriesName = match ? match[1].trim() : title;
    let season = match && match[2] ? `Saison ${match[2]}` : "";
    let episode = match && match[3] ? `Épisode ${match[3]}` : "";
    let state = showSeasonEpisode ? (season && episode ? `${season} - ${episode}` : season || "") : "";

    let imageUrl = document.querySelector<HTMLImageElement>(".full_content-poster img")?.getAttribute("data-src") || "";
    const validImageUrl = await getValidImageUrl(imageUrl);

    if (!showTitle) { // ❌ Si "Afficher le titre" est désactivé
        seriesName = "Regarde une série";
    }

    const playPauseIcons = {
        play: "https://cdn.rcd.gg/PreMiD/resources/play.png",
        pause: "https://cdn.rcd.gg/PreMiD/resources/pause.png",
        viewing: "https://cdn.rcd.gg/PreMiD/resources/viewing.png"
    };

    const isInMenu = videoData.currentTime === 0 && videoData.duration === 0;
    let smallImageKey = isInMenu ? playPauseIcons.viewing : videoData.paused ? playPauseIcons.pause : playPauseIcons.play;
    let smallImageText = isInMenu ? "Navigue..." : videoData.paused ? "En pause" : "Lecture en cours";

    const [startTimestamp, endTimestamp] = presence.getTimestamps(videoData.currentTime, videoData.duration);

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

    presence.setActivity(presenceData);
});
