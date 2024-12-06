// calculator.js

// Base spell odds
const baseSpells = {
    "Sizz": 16, "Sizzle": 20, "Bang": 16, "Kaboom": 20, "Snooze": 17,
    "Flame Slash": 18, "Kacrackle Slash": 18, "Metal Slash": 7, "Hatchet Man": 18,
    "Whack": 8, "Thwack": 12, "Magic Burst": 5, "Kamikazee": 5, "Psyche Up": 16,
    "Oomph": 16, "Acceleratle": 16, "Kaclang": 5, "Bounce": 16, "Heal": 7,
    "Hocus Pocus": 3, "Zoom": 15
};

//3/274*5/271*5/266*5/261
//18/274*18/256*18/238*17/221
// Paired spells that cannot co-occur
const pairedSpells = {
    "Thwack": "Whack", "Whack": "Thwack",
    "Bang": "Kaboom", "Kaboom": "Bang",
    "Sizz": "Sizzle", "Sizzle": "Sizz"
};

/**
 * Generates all non-repeating permutations of size k from the input array.
 * @param {Array} arr - The input array.
 * @param {number} k - The size of each permutation.
 * @returns {Array} - An array of permutations, each being an array.
 */
function getPermutations(arr, k) {
    const results = [];
    
    function permute(current, remaining) {
        if (current.length === k) {
            results.push([...current]);
            return;
        }
        for (let i = 0; i < remaining.length; i++) {
            current.push(remaining[i]);
            permute(current, remaining.slice(0, i).concat(remaining.slice(i + 1)));
            current.pop();
        }
    }
    
    permute([], arr);
    return results;
}

/**
 * Applies modifiers to the base spells to get modified spells.
 * @param {Object} spells - Base spell odds.
 * @param {Object} modifiers - Active modifiers.
 * @returns {Object} - Modified spell odds.
 */
function applyModifiers(spells, modifiers) {
    let modifiedSpells = { ...spells };
    if (modifiers.zoomModifier && modifiedSpells["Zoom"] != null) modifiedSpells["Zoom"] *= 3;
    if (modifiers.metalOpponent && modifiedSpells["Metal Slash"] != null) modifiedSpells["Metal Slash"] *= 3;
    if (modifiers.last30Seconds && modifiedSpells["Kaclang"] != null) modifiedSpells["Kaclang"] = 0;
    if (modifiers.healUsedUp && modifiedSpells["Heal"] != null) modifiedSpells["Heal"] = 0;
    if (modifiers.psycheUpActive && modifiedSpells["Psyche Up"] != null) modifiedSpells["Psyche Up"] = 0;
    if (modifiers.oomphActive && modifiedSpells["Oomph"] != null) modifiedSpells["Oomph"] = 0;
    if (modifiers.acceleratleActive && modifiedSpells["Acceleratle"] != null) modifiedSpells["Acceleratle"] = 0;
    if (modifiers.bounceActive) {
        modifiedSpells["Bounce"] = 0;
        if (modifiedSpells["Acceleratle"] != null) modifiedSpells["Acceleratle"] *= 0.5;
        if (modifiedSpells["Oomph"] != null) modifiedSpells["Oomph"] *= 0.5;
        if (modifiedSpells["Heal"] != null) modifiedSpells["Heal"] *= 0.8;
        if (modifiedSpells["Kaclang"] != null) modifiedSpells["Kaclang"] *= 0.8;
    }
    if (modifiers.bounceModifier && modifiedSpells["Bounce"] != null) modifiedSpells["Bounce"] *= 0.2;
    return modifiedSpells;
}

/**
 * Parses CSV data and returns an array of scenarios.
 * Each scenario is an object with a name and an array of previous spells.
 * @param {string} csv - The CSV data as a string.
 * @returns {Array} - Array of scenario objects.
 */
function parseSteadyStates(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
    const scenarios = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue; // Skip empty lines
        const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
        const scenario = {};
        headers.forEach((header, index) => {
            scenario[header] = values[index] || "";
        });
        // Extract previous spells
        const prevSpells = [
            scenario["Previous Spell 1"],
            scenario["Previous Spell 2"],
            scenario["Previous Spell 3"],
            scenario["Previous Spell 4"]
        ].filter(spell => spell !== "");
        scenarios.push({
            name: scenario["Scenario Name"] || `Scenario ${i}`,
            spells: prevSpells
        });
    }
    return scenarios;
}

/**
 * Computes the probability of each spell appearing in any slot using sequential selection.
 * @param {Object} spells - Object containing spell names and their modified odds.
 * @param {Array} previousMenu - Array of spells present in the previous menu.
 * @returns {Object} - Object containing spells and their probabilities as formatted strings.
 */
function computeNextMenuOdds(spells, previousMenu) {
    // 1. Exclude previous menu spells
    let availableSpells = { ...spells };
    previousMenu.forEach(spell => {
        delete availableSpells[spell];
    });

    // Debug: Log available spells after exclusion
    console.log('Available Spells after exclusion:', availableSpells);

    // 2. List of available spell names
    const availableSpellNames = Object.keys(availableSpells);

    // 3. Generate all possible 4-spell combinations
    let allMenus = getPermutations(availableSpellNames, 4);

    // Debug: Log number of total combinations
    console.log(`Total combinations before filtering: ${allMenus.length}`);

    // 4. Filter out menus containing paired spells
    const filteredMenus = allMenus.filter(menu => {
        for (let i = 0; i < menu.length; i++) {
            const spell = menu[i];
            const paired = pairedSpells[spell];
            if (paired && menu.includes(paired)) {
                return false; // Invalid menu
            }
        }
        return true; // Valid menu
    });

    // Debug: Log number of valid combinations
    console.log(`Total valid combinations after filtering: ${filteredMenus.length}`);

    // 5. Calculate each menu's probability using sequential selection
    const menuProbabilities = filteredMenus.map(menu => {
        let prob = 1;
        let remainingOdds = Object.values(availableSpells).reduce((a, b) => a + b, 0);
        menu.forEach(spell => {
            const spellOdds = availableSpells[spell];
            const paired = pairedSpells[spell]
            prob *= spellOdds / remainingOdds;
            remainingOdds -= spellOdds;
            if (paired && availableSpellNames.includes(paired)){
                remainingOdds -= availableSpells[paired];
            }
        });
        return prob;
    });

    // Debug: Log first 5 menu probabilities
    console.log('Menu probabilities:', menuProbabilities);

    // 6. Aggregate spell probabilities
    let spellProbabilities = {};
    for (const spell in spells) {
        spellProbabilities[spell] = 0;
    }

    filteredMenus.forEach((menu, index) => {
        menu.forEach(spell => {
            spellProbabilities[spell] += menuProbabilities[index];
        });
    });

    // 7. Convert probabilities to percentages with three decimal places
    for (const spell in spellProbabilities) {
        spellProbabilities[spell] = (spellProbabilities[spell] * 100).toFixed(3) + '%';
    }

    // 8. Ensure total sum is 400%
    let sumPercent = 0;
    for (const spell in spellProbabilities) {
        sumPercent += parseFloat(spellProbabilities[spell]);
    }

    // Debug: Log sum of probabilities before adjustment
    console.log(`Sum of Probabilities before adjustment: ${sumPercent}%`);

    // Debug: Log final spell probabilities
    console.log('Final Spell Probabilities:', spellProbabilities);

    return spellProbabilities;
}


/**
 * Initializes the calculator by populating selectors and setting up event listeners.
 */
function initializeCalculator() {
    const spellNames = Object.keys(baseSpells);
    const prevSelectors = ["prevSpell1", "prevSpell2", "prevSpell3", "prevSpell4"];
    prevSelectors.forEach(id => {
        const select = document.getElementById(id);
        spellNames.forEach(spell => {
            const option = document.createElement('option');
            option.value = spell;
            option.textContent = spell;
            select.appendChild(option);
        });
    });

    // Prevent duplicate selections
    prevSelectors.forEach((id, index) => {
        const select = document.getElementById(id);
        select.addEventListener('change', () => {
            const selectedSpells = prevSelectors.map(selId => document.getElementById(selId).value);
            prevSelectors.forEach(selId => {
                const sel = document.getElementById(selId);
                Array.from(sel.options).forEach(option => {
                    option.disabled = selectedSpells.includes(option.value) && option.value !== sel.value;
                });
            });
        });
    });

    // Populate steadyState_select from csvData
    if (typeof csvData !== 'undefined') {
        const scenarios = parseSteadyStates(csvData);
        const steadyStateSelect = document.getElementById('steadyState_select');
        scenarios.forEach((scenario, index) => {
            const option = document.createElement('option');
            option.value = index; // Use index as value
            option.textContent = scenario.name;
            steadyStateSelect.appendChild(option);
        });

        // Store scenarios globally for later access
        window.steadyStateScenarios = scenarios;
    } else {
        console.warn('steady_states.js did not define csvData.');
    }

    // Handle radio button changes
    const radioButtons = document.getElementsByName('prev_menu_option');
    const manualSelectionDiv = document.getElementById('manualSelection');
    const steadyStateSelectionDiv = document.getElementById('steadyStateSelection');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'manual') {
                manualSelectionDiv.style.display = 'block';
                steadyStateSelectionDiv.style.display = 'none';
            } else if (radio.value === 'steady_state') {
                manualSelectionDiv.style.display = 'none';
                steadyStateSelectionDiv.style.display = 'block';
            } else {
                manualSelectionDiv.style.display = 'none';
                steadyStateSelectionDiv.style.display = 'none';
            }
        });
    });

    // Handle Calculate button click
    const calculateButton = document.getElementById('calculateButton');
    calculateButton.addEventListener('click', calculateNextMenuOdds);
}

/**
 * Calculates and displays the next menu spell probabilities.
 */
function calculateNextMenuOdds() {
    // Gather modifiers
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

    // Determine previous menu spells
    const selectedOption = document.querySelector('input[name="prev_menu_option"]:checked').value;
    let previousMenu = [];

    if (selectedOption === 'manual') {
        previousMenu.push(document.getElementById('prevSpell1').value);
        previousMenu.push(document.getElementById('prevSpell2').value);
        previousMenu.push(document.getElementById('prevSpell3').value);
        previousMenu.push(document.getElementById('prevSpell4').value);
        // Remove empty selections
        previousMenu = previousMenu.filter(spell => spell !== "");
    } else if (selectedOption === 'steady_state') {
        const steadyStateSelect = document.getElementById('steadyState_select');
        const selectedIndex = steadyStateSelect.value;
        if (selectedIndex === "none" || selectedIndex === "") {
            alert('Please select a valid steady-state scenario.');
            return;
        }
        const scenario = window.steadyStateScenarios[selectedIndex];
        if (scenario && scenario.spells.length > 0) {
            previousMenu = scenario.spells;
        } else {
            alert('Selected steady-state scenario does not have valid previous spells.');
            return;
        }
    }
    // If first_menu is selected, previousMenu remains empty

    // Apply modifiers to spells
    let modifiedSpells = applyModifiers(baseSpells, modifiers);

    // Compute next menu probabilities
    const result = computeNextMenuOdds(modifiedSpells, previousMenu);

    // Display results
    const resultsDiv = document.getElementById('calculatorResults');
    const tbody = document.getElementById('calculatorResultsBody');
    tbody.innerHTML = ''; // Clear previous results

    let totalSum = 0;

    for (const [spell, prob] of Object.entries(result)) {
        const row = document.createElement('tr');
        const spellCell = document.createElement('td');
        spellCell.textContent = spell;
        const probCell = document.createElement('td');
        probCell.textContent = prob;
        row.appendChild(spellCell);
        row.appendChild(probCell);
        tbody.appendChild(row);

        // Accumulate total sum
        totalSum += parseFloat(prob);
    }

    console.log(`Total Sum of Probabilities: ${totalSum}%`);

    // Display the results div
    resultsDiv.style.display = 'block';
}

// Initialize the calculator when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeCalculator);
