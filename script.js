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
let players = [];

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

    loadPlayers();
};

/* LOAD PLAYERS FROM FIREBASE */
async function loadPlayers() {
    try {
        const snapshot = await fb.getDocs(
            fb.collection(db, "players")
        );

        players = [];

        snapshot.forEach(docSnap => {
            players.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderPlayers();
    } catch (error) {
        console.error("Error loading players:", error);
    }
}

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

    let filtered = players.filter(player =>
        player.name.toLowerCase().includes(state.search)
    );

    filtered.sort((a, b) => {
        if (state.mode === "overall") {
            return (b.points || 0) - (a.points || 0);
        }

        let aTier = String(a.tiers[state.mode] || "D").toUpperCase();
        let bTier = String(b.tiers[state.mode] || "D").toUpperCase();

        if (tierRank[bTier] !== tierRank[aTier]) {
            return tierRank[bTier] - tierRank[aTier];
        }

        return (b.points || 0) - (a.points || 0);
    });

    filtered.forEach((player, index) => {
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
                <button onclick="editPlayer('${player.id}')">✏️</button>
                <button onclick="deletePlayer('${player.id}')">❌</button>
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
    const glowClass = isPlus ? "glow neon-plus" : "glow neon";

    if (baseTier === "S") return `splus ${glowClass}`;
    if (baseTier === "A") return `a ${glowClass}`;
    if (baseTier === "B") return `b ${glowClass}`;
    if (baseTier === "C") return `c ${glowClass}`;
    if (baseTier === "D") return `d ${glowClass}`;

    return "";
}

/* ADD PLAYER */
async function addPlayer() {
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

    await addPlayerToDB(newPlayer);

    document.getElementById("name").value = "";
    document.getElementById("region").value = "";
    document.getElementById("sword").value = "";
    document.getElementById("nethpot").value = "";
    document.getElementById("diapot").value = "";
    document.getElementById("vanilla").value = "";

    alert("Player added");
}

/* ADD PLAYER TO FIREBASE */
async function addPlayerToDB(player) {
    try {
        await fb.addDoc(
            fb.collection(db, "players"),
            player
        );

        loadPlayers();
    } catch (error) {
        console.error("Error adding player:", error);
    }
}

/* DELETE PLAYER */
async function deletePlayer(id) {
    if (!confirm("Delete this player?")) return;

    try {
        await fb.deleteDoc(fb.doc(db, "players", id));
        loadPlayers();
    } catch (error) {
        console.error("Error deleting player:", error);
    }
}

/* EDIT PLAYER */
async function editPlayer(id) {
    const p = players.find(player => player.id === id);
    if (!p) return;

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

    await updatePlayer(id, {
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
    });
}

/* UPDATE PLAYER IN FIREBASE */
async function updatePlayer(id, data) {
    try {
        await fb.updateDoc(fb.doc(db, "players", id), data);
        loadPlayers();
    } catch (error) {
        console.error("Error updating player:", error);
    }
}

document.querySelectorAll("a").forEach(link => {
    if (link.href && !link.target && !link.href.includes("#")) {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            const href = this.href;

            document.body.classList.remove("loaded");

            setTimeout(() => {
                window.location.href = href;
            }, 400);
        });
    }
});

async function updatePlayerCount() {
    const snapshot = await fb.getDocs(
        fb.collection(db, "players")
    );

    document.getElementById("playerCount").innerText =
        snapshot.size + " Players Ranked";
}

window.onload = () => {
    document.body.classList.add("loaded");
    loadPlayers();
    updatePlayerCount();
};
