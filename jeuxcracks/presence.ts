const presence = new Presence({
    clientId: "1357293396632404020" // ID de jeuxcracks
});

// 🔍 Détection de la page
function getPageType(): string {
    const h1 = document.querySelector("h1")?.textContent?.trim();
    if (h1 === "Vos jeux préférés gratuitement") return "menu";
    if (document.querySelector("h1.text-3xl.uppercase.font-bold")?.textContent?.trim() === "Liste des jeux") return "catalogue";
    if (document.querySelector("h1.text-3xl.font-bold")) return "jeu";
    return "inconnu";
}

// 🔄 Mise à jour de la présence
async function updatePresence() {
    const pageType = getPageType();

    let presenceData: PresenceData = {
        type: 3,
        largeImageKey: "https://s3-eu-west-1.amazonaws.com/tpd/logos/625afa4c85711e7bcb45c3b0/0x0.png",
        largeImageText: "jeuxcracks.fr"
    };

    if (pageType === "menu") {
        presenceData.details = "Dans le menu";
        presenceData.state = "Recherche un jeu...";
    }

    else if (pageType === "catalogue") {
        const nombreJeux = document.querySelector("h1.text-3xl.uppercase.font-bold + p")?.textContent?.match(/\d+/)?.[0] ?? "Inconnu";
        presenceData.details = "Parcourt le catalogue de jeux";
        presenceData.state = `${nombreJeux} jeux disponibles`;
    }

    else if (pageType === "jeu") {
        const nomDuJeu = document.querySelector("h1.text-3xl.font-bold")?.textContent?.trim() ?? "Jeu inconnu";

        // 🔸 Crédits
        const credits = [...document.querySelectorAll("li")]
            .find(el => el.textContent?.includes("Crédit"))?.textContent?.split(":")[1]?.trim() ?? "Inconnu";

        // 🔸 Multijoueur
        const multijoueur = [...document.querySelectorAll("li")]
            .find(el => el.textContent?.includes("Multijoueur"))?.textContent?.split(":")[1]?.trim();
        const mode = multijoueur?.toLowerCase() === "oui" ? "Multijoueur" : "Solo";

        // 🔸 Vues
        const vues = [...document.querySelectorAll("li")]
            .find(el => el.textContent?.includes("Nombre de vues"))?.textContent?.split(":")[1]?.trim() ?? "0";

        // 🔸 Note
        const note = document.querySelector("p.slide-bottom span.text-primary-400")?.textContent?.trim();

        presenceData.details = `${nomDuJeu} (${credits})`;
        presenceData.state = `${mode} • ${vues} vues`;
        presenceData.smallImageKey = "https://cdn.rcd.gg/PreMiD/resources/reading.png";
        presenceData.smallImageText = note ? `Note : ${note}` : "Note non disponible";
        presenceData.buttons = [
            { label: "Télécharger ce jeu", url: window.location.href }
        ];
    }

    // 🔁 Appliquer la présence
    presence.setActivity(presenceData);
}

// 🔄 Mise à jour auto
presence.on("UpdateData", updatePresence);
