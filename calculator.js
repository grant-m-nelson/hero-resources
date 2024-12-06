// calculator.js

// Base spell odds
const baseSpells = {
    "Sizz": 16, "Sizzle": 20, "Bang": 16, "Kaboom": 20, "Snooze": 17,
    "Flame Slash": 18, "Kacrackle Slash": 18, "Metal Slash": 7, "Hatchet Man": 18,
    "Whack": 8, "Thwack": 12, "Magic Burst": 5, "Kamikazee": 5, "Psyche Up": 16,
    "Oomph": 16, "Acceleratle": 16, "Kaclang": 5, "Bounce": 16, "Heal": 7,
    "Hocus Pocus": 3, "Zoom": 15
};

// Paired spells that cannot co-occur
const pairedSpells = {
    "Thwack": "Whack", "Whack": "Thwack",
    "Bang": "Kaboom", "Kaboom": "Bang",
    "Sizz": "Sizzle", "Sizzle": "Sizz"
};

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

function computeNextMenuOdds(spells, previousMenu) {
    let availableSpells = { ...spells };
    previousMenu.forEach(spell => {
        delete availableSpells[spell];
    });

    const availableSpellNames = Object.keys(availableSpells);
    let allMenus = getPermutations(availableSpellNames, 4);

    const filteredMenus = allMenus.filter(menu => {
        for (let i = 0; i < menu.length; i++) {
            const spell = menu[i];
            const paired = pairedSpells[spell];
            if (paired && menu.includes(paired)) {
                return false;
            }
        }
        return true;
    });

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

    let spellProbabilities = {};
    for (const spell in spells) {
        spellProbabilities[spell] = 0;
    }

    filteredMenus.forEach((menu, index) => {
        menu.forEach(spell => {
            spellProbabilities[spell] += menuProbabilities[index];
        });
    });

    for (const spell in spellProbabilities) {
        spellProbabilities[spell] = (spellProbabilities[spell] * 100).toFixed(3) + '%';
    }

    return spellProbabilities;
}


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

    const radioButtons = document.getElementsByName('prev_menu_option');
    const manualSelectionDiv = document.getElementById('manualSelection');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'manual') {
                manualSelectionDiv.style.display = 'block';
            } else {
                manualSelectionDiv.style.display = 'none';
            }
        });
    });

    const calculateButton = document.getElementById('calculateButton');
    calculateButton.addEventListener('click', calculateNextMenuOdds);
}

function calculateNextMenuOdds() {
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

    const selectedOption = document.querySelector('input[name="prev_menu_option"]:checked').value;
    let previousMenu = [];

    if (selectedOption === 'manual') {
        previousMenu.push(document.getElementById('prevSpell1').value);
        previousMenu.push(document.getElementById('prevSpell2').value);
        previousMenu.push(document.getElementById('prevSpell3').value);
        previousMenu.push(document.getElementById('prevSpell4').value);

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

    let modifiedSpells = applyModifiers(baseSpells, modifiers);

    const result = computeNextMenuOdds(modifiedSpells, previousMenu);

    const resultsDiv = document.getElementById('calculatorResults');
    const tbody = document.getElementById('calculatorResultsBody');
    tbody.innerHTML = '';

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

        totalSum += parseFloat(prob);
    }

    console.log(`Total Sum of Probabilities: ${totalSum}%`);

    resultsDiv.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initializeCalculator);
