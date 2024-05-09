// Initialize the list of spells with their respective odds
const spells = {
    "Sizz": 16, "Sizzle": 20, "Bang": 16, "Kaboom": 20, "Snooze": 17,
    "Flame Slash": 18, "Kacrackle Slash": 18, "Metal Slash": 7, "Hatchet Man": 18,
    "Whack": 8, "Thwack": 12, "Magic Burst": 5, "Kamikazee": 5, "Psyche Up": 16,
    "Oomph": 16, "Acceleratle": 16, "Kaclang": 5, "Bounce": 16, "Heal": 7,
    "Hocus Pocus": 3, "Zoom": 15
};

// Initialize variables to keep track of spell counts and percentages
let totalSpellCounts = {};
let totalSpellPercentages = {};
let primedMenuPullCounts = {};
let primedMenuPullPercentages = {};
let totalMenuCount = 0;

for (const spell in spells) {
    totalSpellCounts[spell] = 0;
    totalSpellPercentages[spell] = 0;
    primedMenuPullCounts[spell] = 0;
    primedMenuPullPercentages[spell] = 0;
}

function simulate() {
    // Get the modifiers from the form
    const modifiers = {
      zoomModifier: document.getElementById('zoom_modifier').checked,
      metalOpponent: document.getElementById('metal_opponent').checked,
      last30Seconds: document.getElementById('last_30_seconds').checked,
      healUsedUp: document.getElementById('heal_used_up').checked,
      psycheUpActive: document.getElementById('psyche_up_active').checked,
      oomphActive: document.getElementById('oomph_active').checked,
      acceleratleActive: document.getElementById('acceleratle_active').checked,
      bounceActive: document.getElementById('bounce_active').checked,
      bounceModifier: document.getElementById('bounce_modifier').checked
    };
  
    // Get the number of menus to simulate
    const numMenus = Number(document.getElementById('num_menus').value);

    // Get the chunk size
    const chunkSize = Number(document.getElementById('chunk_size').value);
  
    // Run the simulation
    simulateMenus(numMenus, modifiers, chunkSize);
}

function simulateMenus(numMenus, modifiers, chunkSize) {
    // Reset the total spell counts and total menu count
    for (const spell in spells) {
        totalSpellCounts[spell] = 0;
    }
    totalMenuCount = 0;
    let previousMenu = [];
    const modifiedSpells = applyModifiers(modifiers);

    function runChunk(startIndex) {
        for (let i = startIndex; i < startIndex + chunkSize && i < numMenus; i++) {
            let currentMenu = [];
            for (let j = 0; j < 4; j++) {
                const spell = getSpell(previousMenu, currentMenu, modifiedSpells);
                currentMenu.push(spell);
                totalSpellCounts[spell] += 1;
            }
            totalMenuCount += 1;
            previousMenu = currentMenu;
        }
    
        // Update the percentages/progress after each chunk and display results
        updatePercentages();
        updateProgress(startIndex + chunkSize, numMenus);
        displayResults();
    
        if (startIndex + chunkSize < numMenus) {
            // Schedule the next chunk
            setTimeout(() => runChunk(startIndex + chunkSize), 0);
        }
    }

    // Start the simulation by running the first chunk
    runChunk(0);
}

function getSpell(previousMenu, currentMenu, modifiedSpells) {
    let availableSpells = { ...modifiedSpells}
    previousMenu.forEach(spell => delete availableSpells[spell]);
    currentMenu.forEach(spell => delete availableSpells[spell]);
    if (currentMenu.includes("Bang") || currentMenu.includes("Kaboom")) {
        delete availableSpells["Bang"];
        delete availableSpells["Kaboom"];
    }
    if (currentMenu.includes("Sizz") || currentMenu.includes("Sizzle")) {
        delete availableSpells["Sizz"];
        delete availableSpells["Sizzle"];
    }
    if (currentMenu.includes("Whack") || currentMenu.includes("Thwack")) {
        delete availableSpells["Whack"];
        delete availableSpells["Thwack"];
    }
    const totalOdds = Object.values(availableSpells).reduce((a, b) => a + b, 0);
    const randomChoice = Math.random() * totalOdds;
    let cumulativeOdds = 0;
    for (const [spell, odds] of Object.entries(availableSpells)) {
        cumulativeOdds += odds;
        if (randomChoice <= cumulativeOdds) return spell;
    }
}

function applyModifiers(modifiers) {
    let modifiedSpells = { ...spells };
    if (modifiers.zoomModifier) modifiedSpells["Zoom"] *= 3;
    if (modifiers.metalOpponent) modifiedSpells["Metal Slash"] *= 3;
    if (modifiers.last30Seconds) modifiedSpells["Kaclang"] = 0;
    if (modifiers.healUsedUp) modifiedSpells["Heal"] = 0;
    if (modifiers.psycheUpActive) modifiedSpells["Psyche Up"] = 0;
    if (modifiers.oomphActive) modifiedSpells["Oomph"] = 0;
    if (modifiers.acceleratleActive) modifiedSpells["Acceleratle"] = 0;
    if (modifiers.bounceActive) {
        modifiedSpells["Bounce"] = 0;
        modifiedSpells["Acceleratle"] *= 1 / 2;
        modifiedSpells["Oomph"] *= 1 / 2;
        modifiedSpells["Heal"] *= 4 / 5;
        modifiedSpells["Kaclang"] *= 4 / 5;
    }
    if (modifiers.bounceModifier) modifiedSpells["Bounce"] *= 1 / 5;
    return modifiedSpells;
}

function updatePercentages() {
    for (const spell in totalSpellPercentages) {
        totalSpellPercentages[spell] = (totalSpellCounts[spell] / totalMenuCount) * 100;
        primedMenuPullPercentages[spell] = (totalSpellCounts[spell] / totalMenuCount) / (1 - (totalSpellCounts[spell] / totalMenuCount)) * 100;
    }
}

function updateProgress(current, total) {
    const progressDiv = document.getElementById('progress');
    progressDiv.textContent = `Total menus simulated: ${current} / Total menus to simulate: ${total}`;
}

function displayResults() {
    // Populate the results table
    const resultsTableBody = document.getElementById('resultsTableBody');
    resultsTableBody.innerHTML = ''; // Clear the existing rows
    for (const spell in totalSpellPercentages) {
        const row = document.createElement('tr');
        const spellCell = document.createElement('td');
        const avgPercentCell = document.createElement('td');
        const avgPrimedPercentCell = document.createElement('td');
        spellCell.textContent = spell;
        avgPercentCell.textContent = totalSpellPercentages[spell].toFixed(2) + '%';
        avgPrimedPercentCell.textContent = primedMenuPullPercentages[spell].toFixed(2) + '%';
        row.appendChild(spellCell);
        row.appendChild(avgPercentCell);
        row.appendChild(avgPrimedPercentCell);
        resultsTableBody.appendChild(row);
    }

    // Show the results
    document.getElementById('results').style.display = 'block';
}