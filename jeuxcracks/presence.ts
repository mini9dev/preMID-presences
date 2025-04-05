const presence = new Presence({
    clientId: "1357293396632404020" // ID de jeuxcracks
});

// 🔍 Détection de la page
function getPageType(): string {
    const h1 = document.querySelector("h1")?.textContent?.trim();

    if (h1 === "Vos jeux préférés gratuitement") return "menu";
    if (window.location.href.includes("/search?search=")) return "recherche";
    if (window.location.pathname === "/contact") return "contact";
    if (document.querySelector("h1.text-3xl.uppercase.font-bold")?.textContent?.trim() === "Liste des jeux") return "catalogue";
    if (document.querySelector("h1.text-3xl.font-bold")) return "jeu";

    return "inconnu";
}

// 🔄 Mise à jour de la présence Discord
async function updatePresence() {
    const pageType = getPageType();

    let presenceData: PresenceData = {
        type: 3,
        largeImageKey:  "https://s3-eu-west-1.amazonaws.com/tpd/logos/625afa4c85711e7bcb45c3b0/0x0.png",
        largeImageText: "jeuxcracks.fr"
    };

    // 🎮 Menu principal
    if (pageType === "menu") {
        presenceData.details = "Dans le menu";
        presenceData.state  = "Recherche un jeu...";
    }

    // 📚 Catalogue
    else if (pageType === "catalogue") {
        const nombreJeux = document
            .querySelector("h1.text-3xl.uppercase.font-bold + p")
            ?.textContent?.match(/\d+/)?.[0] ?? "Inconnu";

        presenceData.details = "Parcourt le catalogue de jeux";
        presenceData.state  = `${nombreJeux} jeux disponibles`;
    }

    // 🔍 Recherche
    else if (pageType === "recherche") {
        const terme = new URLSearchParams(window.location.search).get("search") ?? "un jeu";

        presenceData.details         = "Recherche un jeu";
        presenceData.state          = `Recherche : ${terme}`;
        presenceData.smallImageKey  = "https://cdn.rcd.gg/PreMiD/resources/search.png";
        presenceData.smallImageText = "Recherche en cours";
    }

    // 📬 Page de contact
    else if (pageType === "contact") {
        presenceData.details = "Contacte l'équipe";
        presenceData.state   = "Rejoins-nous sur Discord";
        presenceData.buttons = [
            {
                label: "Rejoindre le Discord",
                url:   "https://discord.gg/4mFZETCW58"
            }
        ];
    }

    // 🎮 Page d'un jeu
    else if (pageType === "jeu") {
        const nomDuJeu = document
            .querySelector("h1.text-3xl.font-bold")
            ?.textContent?.trim() ?? "Jeu inconnu";

        const credits = [...document.querySelectorAll("li")]
            .find(el => el.textContent?.includes("Crédit"))
            ?.textContent?.split(":")[1]?.trim();

        const multijoueur = [...document.querySelectorAll("li")]
            .find(el => el.textContent?.includes("Multijoueur"))
            ?.textContent?.split(":")[1]?.trim();

        const mode = multijoueur?.toLowerCase() === "oui" ? "Multijoueur" : "Solo";

        const vues = [...document.querySelectorAll("li")]
            .find(el => el.textContent?.includes("Nombre de vues"))
            ?.textContent?.split(":")[1]?.trim() ?? "0";

        const note = document
            .querySelector("p.slide-bottom span.text-primary-400")
            ?.textContent?.trim();

        presenceData.details = credits && credits.length > 0
            ? `${nomDuJeu} (${credits})`
            : nomDuJeu;

        presenceData.state           = `${mode} • ${vues} vues`;
        presenceData.smallImageKey  = "https://cdn.rcd.gg/PreMiD/resources/reading.png";
        presenceData.smallImageText = note ? `Note : ${note}` : "Note non disponible";
        presenceData.buttons        = [
            {
                label: "Télécharger ce jeu",
                url:   window.location.href
            }
        ];
    }

    // ✅ Appliquer la présence
    presence.setActivity(presenceData);
}

// 🔁 Rafraîchir la présence à chaque changement
presence.on("UpdateData", updatePresence);
