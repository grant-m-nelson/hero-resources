document.addEventListener('DOMContentLoaded', function() {
    const averageForm = document.getElementById('averageForm');
    const averageResults = document.getElementById('averageResults');

    averageForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // csvData is defined in steady_states.js
        const rows = csvData.trim().split('\n');
        const headers = rows[0].split(',').slice(1); // Skip the first column for headers

        let values;
        const matchedRow = rows.slice(1).find(row => {
            const match = row.match(/^"(.+?)",(.+)$/); // Extract JSON and the remaining values
            if (!match) {
                return false;
            }
            const jsonData = match[1];
            values = match[2].split(',').map(value => value.trim().replace(/^'(.*)'$/, "$1"));

            try {
                const json = parseModifiersJson(jsonData);
                const selectedModifiers = {
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
                return Object.keys(selectedModifiers).every(modifier => json[modifier] === selectedModifiers[modifier]);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                return false;
            }
        });

        if (matchedRow && values) {
            const spellAverages = {};
            headers.forEach((spell, index) => {
                spellAverages[spell] = parseFloat(values[index]);
            });
            displayAverages(spellAverages);
        } else {
            averageResults.innerHTML = 'No data found for selected modifiers.';
        }
    });

    function parseModifiersJson(jsonStr) {
    let modifiedJson = jsonStr.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true');

    try {
        const parsedJson = JSON.parse(modifiedJson);
        return parsedJson;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        throw error;
    }
    }

    function displayAverages(spellAverages) {
        averageResults.innerHTML = ''; // Clear previous results

        // Add an h2 header for results
        const resultsHeader = document.createElement('h2');
        resultsHeader.textContent = 'Results:';
        averageResults.appendChild(resultsHeader);

        const table = document.createElement('table');
        table.id = 'resultsTable'; // Set ID for styling
        table.className = 'resultsTable'; // Set class for styling
        const tbody = document.createElement('tbody');
        tbody.id = 'resultsTableBody'; // Set ID for tbody element
        table.appendChild(tbody);

        // Create header row
        const headerRow = document.createElement('tr');
        ['Spell', 'Average %', 'Average Primed %'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        tbody.appendChild(headerRow);

        // Create data rows for each spell average
        Object.entries(spellAverages).forEach(([spell, average]) => {
            const row = document.createElement('tr');
            const spellCell = document.createElement('td');
            spellCell.textContent = spell;
            const averageCell = document.createElement('td');
            averageCell.textContent = `${(average * 100).toFixed(3)}%`;
            const primedCell = document.createElement('td');
            const primedValue = average / (1 - average);
            primedCell.textContent = `${(primedValue * 100).toFixed(3)}%`;
            row.appendChild(spellCell);
            row.appendChild(averageCell);
            row.appendChild(primedCell);
            tbody.appendChild(row);
        });

        averageResults.appendChild(table);
    }
});