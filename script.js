/* STATE MANAGEMENT */
let state = {
    mode: "overall",
    search: ""
};

let adminUnlocked = false;

/* TIER RANKING */
const tierRank = {
    "S+": 9,
    "S": 8,
    "A+": 7,
    "A": 6,
    "B+": 5,
    "B": 4,
    "C+": 3,
    "C": 2,
    "D+": 1.5,
    "D": 1,
    "U": 0
};

/* DATA */
let defaultPlayers = [
    {
        name: "_SenkuChan_",
        sub: "Ranked Combatant",
        points: 28,
        region: "IND",
        avatar: "https://mc-heads.net/avatar/Senku",
        tiers: {
            sword: "C",
            nethpot: "C+",
            diapot: "U",
            vanilla: "B"
        }
    },
    {
        name: "TPTGamerz",
        sub: "Ranked Combatant",
        points: 4,
        region: "IND",
        avatar: "https://mc-heads.net/avatar/TPTGamerz",
        tiers: {
            sword: "U",
            nethpot: "C",
            diapot: "U",
            vanilla: "U"
        }
    }
];

let players = JSON.parse(localStorage.getItem("players")) || defaultPlayers;

/* INIT */
window.onload = () => {
    document.body.classList.add("loaded");

    document.querySelectorAll(".mode").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".mode").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            state.mode = btn.dataset.mode || "overall";
            renderPlayers();
        });
    });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.search = e.target.value.toLowerCase();
            renderPlayers();
        });
    }

    const logo = document.querySelector(".logo");

    if (logo) {
        logo.addEventListener("dblclick", () => {
            const pass = prompt("Enter admin password:");

            if (pass === "senku_op_999") {
                adminUnlocked = true;
                document.getElementById("adminPanel").style.display = "block";
                alert("Admin Unlocked");
                renderPlayers();
            } else {
                alert("Wrong password");
            }
        });
    }

    renderPlayers();
};

/* SAFER BEST TIER */
function getBestTier(player) {
    const values = Object.values(player?.tiers || {});
    let best = "D";

    values.forEach(t => {
        const normalized = String(t).toUpperCase().trim();

        if (tierRank[normalized] === undefined) return;

        if (tierRank[normalized] > tierRank[best]) {
            best = normalized;
        }
    });

    return best;
}

/* RENDER */
function renderPlayers() {
    const container = document.getElementById("players");
    if (!container) return;

    container.innerHTML = "";

    const order = ["sword", "nethpot", "diapot", "vanilla"];
    const currentMode = state.mode;

    let filtered = players
        .map((player, originalIndex) => ({ player, originalIndex }))
        .filter(({ player }) =>
            player.name.toLowerCase().includes(state.search)
        );

    filtered.sort((a, b) => {
        let aTier, bTier;

        if (currentMode === "overall") {
            aTier = getBestTier(a.player);
            bTier = getBestTier(b.player);
        } else {
            aTier = String(a.player.tiers[currentMode] || "D").toUpperCase();
            bTier = String(b.player.tiers[currentMode] || "D").toUpperCase();
        }

        return tierRank[bTier] - tierRank[aTier];
    });

    filtered.forEach(({ player, originalIndex }, index) => {
        let badgesHTML = "";

        if (state.mode === "overall") {
            order.forEach(mode => {
                const tier = player.tiers[mode];

                if (tier) {
                    badgesHTML += createBadge(mode, tier);
                }
            });
        } else {
            const tier = player.tiers[state.mode];

            badgesHTML = tier
                ? createBadge(state.mode, tier)
                : `<span class="badge u">Unranked</span>`;
        }

        const points = player.points || 0;
        const role = player.sub && player.sub.includes("•")
            ? player.sub.split("•")[0].trim()
            : (player.sub || "Ranked Combatant");

        const div = document.createElement("div");
        div.className = "player-card";

        div.innerHTML = `
            <div class="rank-box">${index + 1}</div>

            <div class="player-info">
                <img src="${player.avatar}" alt="${player.name}">
                <div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-sub">${role} • ${points}pts</div>
                </div>
            </div>

            <div class="region">${player.region}</div>

            <div class="badges">${badgesHTML}</div>

            ${adminUnlocked ? `
            <div class="admin-actions">
                <button onclick="editPlayer(${originalIndex})">✏️</button>
                <button onclick="deletePlayer(${originalIndex})">❌</button>
            </div>
            ` : ""}
        `;

        container.appendChild(div);
    });
}

/* BADGE CREATOR */
function createBadge(mode, tier) {
    return `
        <span class="badge ${getTierClass(tier)}">
            <img src="assets/icons/${mode}.svg"
                 onerror="this.src='assets/logo/chantiersicon.png'">
            ${String(tier).toUpperCase().trim()}
        </span>
    `;
}

/* TIER CLASS SYSTEM */
function getTierClass(t) {
    if (!t) return "";

    const tier = String(t).toUpperCase().trim();

    if (tier === "U") return "u";

    const isPlus = tier.endsWith("+");
    const baseTier = isPlus ? tier[0] : tier;

    if (baseTier === "S") return `splus glow${isPlus ? " neon" : ""}`;
    if (baseTier === "A") return `a glow${isPlus ? " neon" : ""}`;
    if (baseTier === "B") return `b glow${isPlus ? " neon" : ""}`;
    if (baseTier === "C") return `c glow${isPlus ? " neon" : ""}`;
    if (baseTier === "D") return `d glow${isPlus ? " neon" : ""}`;

    return "";
}

/* ADD PLAYER */
function addPlayer() {
    const name = document.getElementById("name").value.trim();
    const region = document.getElementById("region").value.trim();

    if (!name || !region) {
        alert("Enter at least name and region");
        return;
    }

    const newPlayer = {
        name: name,
        sub: "Ranked Combatant",
        points: 0,
        region: region,
        avatar: "https://mc-heads.net/avatar/" + name,
        tiers: {
            sword: document.getElementById("sword").value.toUpperCase().trim() || "U",
            nethpot: document.getElementById("nethpot").value.toUpperCase().trim() || "U",
            diapot: document.getElementById("diapot").value.toUpperCase().trim() || "U",
            vanilla: document.getElementById("vanilla").value.toUpperCase().trim() || "U"
        }
    };

    players.push(newPlayer);
    localStorage.setItem("players", JSON.stringify(players));

    renderPlayers();

    document.getElementById("name").value = "";
    document.getElementById("region").value = "";
    document.getElementById("sword").value = "";
    document.getElementById("nethpot").value = "";
    document.getElementById("diapot").value = "";
    document.getElementById("vanilla").value = "";

    alert("Player added");
}

/* DELETE PLAYER */
function deletePlayer(index) {
    if (!confirm("Delete this player?")) return;

    players.splice(index, 1);
    localStorage.setItem("players", JSON.stringify(players));
    renderPlayers();
}

/* EDIT PLAYER */
function editPlayer(index) {
    const p = players[index];

    const name = prompt("Name:", p.name);
    if (!name) return;

    const region = prompt("Region:", p.region);
    if (region === null) return;

    const currentPoints = p.points || 0;
    const points = parseInt(prompt("Points:", currentPoints), 10) || 0;

    const sword = prompt("Sword Tier:", p.tiers.sword || "U");
    if (sword === null) return;

    const nethpot = prompt("NethPot Tier:", p.tiers.nethpot || "U");
    if (nethpot === null) return;

    const diapot = prompt("DiaPot Tier:", p.tiers.diapot || "U");
    if (diapot === null) return;

    const vanilla = prompt("Vanilla Tier:", p.tiers.vanilla || "U");
    if (vanilla === null) return;

    const role = p.sub && p.sub.includes("•")
        ? p.sub.split("•")[0].trim()
        : (p.sub || "Ranked Combatant");

    players[index] = {
        name: name.trim(),
        sub: role,
        points: points,
        region: region.trim(),
        avatar: "https://mc-heads.net/avatar/" + name.trim(),
        tiers: {
            sword: sword.toUpperCase().trim() || "U",
            nethpot: nethpot.toUpperCase().trim() || "U",
            diapot: diapot.toUpperCase().trim() || "U",
            vanilla: vanilla.toUpperCase().trim() || "U"
        }
    };

    localStorage.setItem("players", JSON.stringify(players));
    renderPlayers();
}
