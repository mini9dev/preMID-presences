const presence = new Presence({
    clientId: "1374274880412848179"
});

// ✅ Définir le bon type pour les données reçues de l'iFrame
let videoData: { currentTime: number; duration: number; paused: boolean } = {
    currentTime: 0,
    duration: 0,
    paused: true
};

// 🔁 Écoute des données envoyées par l’iFrame
presence.on("iFrameData", (data: { currentTime: number; duration: number; paused: boolean }) => {
    if (data && typeof data.duration === "number") {
        videoData = data;
    }
});

// ⏱️ Fonction de conversion HH:MM:SS
function parseTime(time: string): number {
    const parts = time.split(":").map(Number);
    while (parts.length < 3) parts.unshift(0); // pour avoir toujours [hh, mm, ss]
    const [hh, mm, ss] = parts;
    return hh * 3600 + mm * 60 + ss;
}

// 📄 Détection de la page
function getPageType(): string {
    if (document.querySelector("span.fKqoZ")) return "episode";
    if (document.querySelector("h1.nVRGN")) return "serie";
    if (document.querySelector("h1.ldLsUs")?.textContent?.includes("Tous les directs")) return "directs";
    if (document.querySelector("svg[aria-labelledby] title")) return "chaine";
    if (document.querySelector("h1[class*='bYPznK']")) return "categorie";
    if (document.querySelector("div[class*='iRgpoQ']")) return "menu";
    return "inconnu";
}

// 🚀 Mise à jour de la présence Discord
async function updatePresence() {
    const pageType = getPageType();
    const presenceData: PresenceData = {
        type: ActivityType.Watching,
        largeImageKey: "https://play-lh.googleusercontent.com/SR505Q0kSPL2Zk73zEIUvfDEj9Jbsi6hik9J-b9tD5Vx65PyjHPwO3nmJE7OcfGHCWc=w240-h480-rw",
        largeImageText: "france.tv"
    };

    if (pageType === "menu") {
        presenceData.details = "Dans le menu principal";
        presenceData.state = "Explore les programmes";
    } else if (pageType === "categorie") {
        const h1 = document.querySelector("h1[class*='bYPznK']")?.textContent?.trim() ?? "Catégorie";
        presenceData.details = `Catégorie : ${h1}`;
        presenceData.state = "Parcourt les contenus";
    } else if (pageType === "directs") {
        presenceData.details = "Regarde les directs";
        presenceData.state = "Tous les directs disponibles";
    } else if (pageType === "chaine") {
        const chaine = document.querySelector("svg[aria-labelledby] title")?.textContent?.trim() ?? "Chaîne inconnue";
        presenceData.details = `Regarde la chaîne ${chaine}`;
        presenceData.state = "En direct";
    } else if (pageType === "serie") {
        const titre = document.querySelector("h1.nVRGN")?.textContent?.trim() ?? "Série inconnue";
        const episodes = document.querySelector("p.hCErrn")?.textContent?.trim() ?? "Épisodes inconnus";
        const chaine = document.querySelector("svg[data-type='channel'] title")?.textContent?.trim() ?? "Chaîne inconnue";
        presenceData.details = titre;
        presenceData.state = `${episodes} • sur ${chaine}`;
    } else if (pageType === "episode") {
        const episodeTitle = document.querySelector("span.fKqoZ")?.textContent?.trim() ?? "Épisode";
        const serieTitle = document.querySelector("span.gVSjbz")?.textContent?.trim() ?? "Série inconnue";

        // Ne rien faire si c’est le faux titre
        if (serieTitle === "Choisir mes catégories préférées") return;

        const [start, end] = presence.getTimestamps(videoData.currentTime, videoData.duration);

        presenceData.details = `Regarde : ${episodeTitle}`;
        presenceData.state = `Série : ${serieTitle}`;
        presenceData.startTimestamp = !videoData.paused ? start : undefined;
        presenceData.endTimestamp = !videoData.paused ? end : undefined;
        presenceData.smallImageKey = videoData.paused
            ? "https://cdn.rcd.gg/PreMiD/resources/pause.png"
            : "https://cdn.rcd.gg/PreMiD/resources/play.png";
        presenceData.smallImageText = videoData.paused ? "En pause" : "Lecture en cours";
    }

    presence.setActivity(presenceData);
}

presence.on("UpdateData", updatePresence);
