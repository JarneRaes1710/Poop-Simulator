let currentUser = null;
let gameState = {
    plops: 0,
    pps: 0,
    upgrades: {
        coffee: { cost: 15, ppsReward: 1, count: 0, elementId: 'upgrade-coffee' },
        taco: { cost: 100, ppsReward: 8, count: 0, elementId: 'upgrade-taco' },
        laxative: { cost: 500, ppsReward: 50, count: 0, elementId: 'upgrade-laxative' }
    }
};

const API_URL = 'http://localhost:3000/api';

// Authentication Logic
async function handleAuth(type) {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');

    if (!username || !password) return errorEl.textContent = "Fill in all fields!";

    try {
        const response = await fetch(`${API_URL}/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error;
        } else {
            if (type === 'login') {
                currentUser = data.username;
                gameState.plops = data.plops;
                gameState.pps = data.pps;
                
                // Readjust upgrade scales based on passive income loadout
                recalculateUpgradeCosts();

                document.getElementById('auth-overlay').style.display = 'none';
                document.getElementById('game-container').style.display = 'block';
                document.getElementById('display-user').textContent = currentUser;
                updateUI();
            } else {
                errorEl.style.color = "green";
                errorEl.textContent = "Registered! Now click Log In.";
            }
        }
    } catch {
        errorEl.textContent = "Cannot connect to server.";
    }
}

// Save Progress to Backend
async function saveGame() {
    if (!currentUser) return;
    await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: currentUser,
            plops: gameState.plops,
            pps: gameState.pps
        })
    });
    alert("Game Saved Successfully!");
}

// Core Tycoon Loop Logic
document.getElementById('main-emoji').addEventListener('click', () => {
    gameState.plops += 1;
    updateUI();
});

function buyUpgrade(type) {
    const upgrade = gameState.upgrades[type];
    if (gameState.plops >= upgrade.cost) {
        gameState.plops -= upgrade.cost;
        upgrade.count++;
        gameState.pps += upgrade.ppsReward;
        upgrade.cost = Math.floor(upgrade.cost * 1.15);
        updateUI();
    }
}

function updateUI() {
    document.getElementById('plop-count').textContent = Math.floor(gameState.plops);
    document.getElementById('pps-count').textContent = gameState.pps;

    for (let key in gameState.upgrades) {
        const upgrade = gameState.upgrades[key];
        const card = document.getElementById(upgrade.elementId);
        if(!card) continue;
        const button = card.querySelector('.buy-btn');
        card.querySelector('.cost').textContent = upgrade.cost;
        button.disabled = gameState.plops < upgrade.cost;
    }
}

function recalculateUpgradeCosts() {
    // Basic scaling catch-up calculation for returning saves
    let temporaryPps = gameState.pps;
    while (temporaryPps > 0) {
        if (temporaryPps >= 50) { gameState.upgrades.laxative.cost = Math.floor(gameState.upgrades.laxative.cost * 1.15); temporaryPps -= 50; }
        else if (temporaryPps >= 8) { gameState.upgrades.taco.cost = Math.floor(gameState.upgrades.taco.cost * 1.15); temporaryPps -= 8; }
        else { gameState.upgrades.coffee.cost = Math.floor(gameState.upgrades.coffee.cost * 1.15); temporaryPps -= 1; }
    }
}

setInterval(() => {
    if (gameState.pps > 0) {
        gameState.plops += (gameState.pps / 10);
        updateUI();
    }
}, 100);