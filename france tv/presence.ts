const presence = new Presence({
    clientId: "1374274880412848179"
});

function getPageType(): string {
    const pathname = window.location.pathname;

    if (pathname === "/" || pathname === "/accueil") return "menu";
    if (/^\/directs\/?$/.test(pathname)) return "directs";
    if (/^\/(series-et-fictions|documentaires|films|societe|info|spectacles-et-culture|sport|jeux-et-divertissements|enfants)\/?$/.test(pathname)) return "categorie";
    if (/^\/(france-2|france-3|france-4|france-5|la1ere|franceinfo|arte|ina)\/?$/.test(pathname)) return "chaine";
    if (/^\/[^\/]+\/[^\/]+\/$/.test(pathname)) return "serie"; // page d'une série
    if (/\.html$/.test(pathname)) return "episode"; // épisode ou film

    return "inconnu";
}

async function updatePresence() {
    const pageType = getPageType();
    const pathname = window.location.pathname;

    const presenceData: PresenceData = {
        type: ActivityType.Watching,
        largeImageKey: "https://play-lh.googleusercontent.com/SR505Q0kSPL2Zk73zEIUvfDEj9Jbsi6hik9J-b9tD5Vx65PyjHPwO3nmJE7OcfGHCWc=w240-h480-rw",
        largeImageText: "france.tv"
    };

    if (pageType === "menu") {
        presenceData.details = "Dans le menu principal";
        presenceData.state = "Explore les programmes";
    } else if (pageType === "categorie") {
        const categorie = pathname.split("/")[1] || "Catégorie inconnue";
        presenceData.details = `Dans la catégorie : ${categorie}`;
        presenceData.state = "Parcourt les contenus";
    } else if (pageType === "directs") {
        presenceData.details = "Regarde les directs";
        presenceData.state = "Tous les directs disponibles";
    } else if (pageType === "chaine") {
        const chaine = pathname.split("/")[1] || "Chaîne inconnue";
        presenceData.details = `Regarde la chaîne : ${chaine}`;
        presenceData.state = "En direct";
    } else if (pageType === "serie") {
        const titre = document.querySelector("h1.nVRGN")?.textContent?.trim() ?? "Série inconnue";
        const episodes = document.querySelector("p.hCErrn")?.textContent?.trim() ?? "";

        presenceData.details = titre;
        presenceData.state = episodes || "Contenu disponible";
    } else if (pageType === "episode") {
        const episodeTitle = document.querySelector("span.fKqoZ")?.textContent?.trim() ?? "Épisode";
        const serieTitle = document.querySelector("span.gVSjbz")?.textContent?.trim() ?? "Série inconnue";

        if (serieTitle === "Choisir mes catégories préférées") return;

        presenceData.details = `Regarde : ${episodeTitle}`;
        presenceData.state = `Série : ${serieTitle}`;
        presenceData.smallImageKey = "https://cdn.rcd.gg/PreMiD/resources/viewing.png";
        presenceData.smallImageText = ""; // rien en petit texte
        presenceData.buttons = [
            { label: "Regarder l'épisode", url: window.location.href }
        ];
    }

    presence.setActivity(presenceData);
}

presence.on("UpdateData", updatePresence);
