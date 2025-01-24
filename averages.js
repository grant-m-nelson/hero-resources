document.addEventListener('DOMContentLoaded', function() {
    const averageForm = document.getElementById('averageForm');
    const averageResults = document.getElementById('averageResults');

    let steadyStatesData = [];
    fetch('steady_states.json')
        .then(response => response.json())
        .then(jsonData => {
            steadyStatesData = jsonData;
        })
        .catch(error => {
            console.error('Failed to load JSON data:', error);
        });

    averageForm.addEventListener('submit', function(event) {
        event.preventDefault();

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

        const matchedRow = steadyStatesData.find(row => {
            if (!row.modifiers) return false;
            return Object.keys(selectedModifiers).every(mod => {
                return row.modifiers[mod] === selectedModifiers[mod];
            });
        });

        if (!matchedRow) {
            averageResults.innerHTML = 'No data found for selected modifiers.';
            return;
        }

        const spellAverages = {};
        Object.entries(matchedRow).forEach(([key, value]) => {
            if (key !== 'modifiers') {
                spellAverages[key] = value;
            }
        });

        displayAverages(spellAverages);
    });

    function displayAverages(spellAverages) {
        averageResults.innerHTML = '';

        const resultsHeader = document.createElement('h2');
        resultsHeader.textContent = 'Results:';
        averageResults.appendChild(resultsHeader);

        const table = document.createElement('table');
        table.id = 'resultsTable';
        table.className = 'resultsTable';
        const tbody = document.createElement('tbody');
        tbody.id = 'resultsTableBody';
        table.appendChild(tbody);

        const headerRow = document.createElement('tr');
        ['Spell', 'Average %', 'Average Primed %'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        tbody.appendChild(headerRow);

        Object.entries(spellAverages).forEach(([spell, average]) => {
            if (typeof average !== 'number') {
                return;
            }
            const row = document.createElement('tr');

            const spellCell = document.createElement('td');
            spellCell.textContent = spell;
            row.appendChild(spellCell);

            const averageCell = document.createElement('td');
            averageCell.textContent = `${(average * 100).toFixed(3)}%`;
            row.appendChild(averageCell);

            const primedCell = document.createElement('td');
            const primedValue = average / (1 - average);
            primedCell.textContent = `${(primedValue * 100).toFixed(3)}%`;
            row.appendChild(primedCell);

            tbody.appendChild(row);
        });

        averageResults.appendChild(table);
    }
});