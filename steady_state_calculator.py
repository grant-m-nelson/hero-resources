import numpy as np
import pandas as pd
from itertools import combinations, permutations
import cProfile
import pstats

def main():
    # Spells dictionary with odds
    spells = {
        "Sizz": 16, "Sizzle": 20, "Bang": 16, "Kaboom": 20, "Snooze": 17,
        "Flame Slash": 18, "Kacrackle Slash": 18, "Metal Slash": 7, "Hatchet Man": 18,
        "Whack": 8, "Thwack": 12, "Magic Burst": 5, "Kamikazee": 5, "Psyche Up": 16,
        "Oomph": 16, "Acceleratle": 16, "Kaclang": 5, "Bounce": 16, "Heal": 7,
        "Hocus Pocus": 3, "Zoom": 15
    }

    # Incompatible spell pairs
    incompatible_spells = [("Thwack", "Whack"), ("Bang", "Kaboom"), ("Sizz", "Sizzle")]
    paired_spells = {
        "Thwack": "Whack", "Whack": "Thwack",
        "Bang": "Kaboom", "Kaboom": "Bang",
        "Sizz": "Sizzle", "Sizzle": "Sizz"
    }


    # Generate all possible menus of 4 spells that don't include incompatible pairs
    spell_names = list(spells.keys())
    all_possible_menus = list(combinations(spell_names, 4))
    filtered_menus = [menu for menu in all_possible_menus if not any(x in menu and y in menu for x, y in incompatible_spells)]

    # Dictionary to index menus for easier matrix handling
    menu_index = {menu: idx for idx, menu in enumerate(filtered_menus)}
    menu_perms = {menu: list(permutations(menu)) for menu in filtered_menus}

    P = np.zeros((len(filtered_menus), len(filtered_menus)))

    for idx, current_menu in enumerate(filtered_menus):
        current_idx = menu_index[current_menu]
        remaining_spells = {name: spells[name] for name in spells if name not in current_menu}
        print(f'\r{idx} / {len(filtered_menus)}, {100 * idx / len(filtered_menus):.2f}%', end='\r')
        
        beginning_odds = sum(remaining_spells.values())
        removal_rolls = {
            spell: remaining_spells[spell] + remaining_spells.get(paired_spells.get(spell, ''), 0)
            for spell in remaining_spells
        }
        valid_next_menus = [next_menu for next_menu in filtered_menus if not any(spell in next_menu for spell in current_menu)]
        all_perms = [(menu_index[menu], perm) for menu in valid_next_menus for perm in menu_perms[menu]]

        df = pd.DataFrame(all_perms, columns=['MenuIndex', 'Permutation'])
        df[['Spell1', 'Spell2', 'Spell3', 'Spell4']] = pd.DataFrame(df['Permutation'].tolist(), index=df.index)

        for i in range(1, 5):
            df[f'Spell{i}Rolls'] = df[f'Spell{i}'].map(remaining_spells)
            df[f'Spell{i}RemovalRolls'] = df[f'Spell{i}'].map(removal_rolls)

        df['ProbProduct'] = df['Spell1Rolls'] / beginning_odds * \
        df['Spell2Rolls'] / (beginning_odds - df['Spell1RemovalRolls']) * \
        df['Spell3Rolls'] / (beginning_odds - df['Spell1RemovalRolls'] - df['Spell2RemovalRolls']) * \
        df['Spell4Rolls'] / (beginning_odds - df['Spell1RemovalRolls'] - df['Spell2RemovalRolls'] - df['Spell3RemovalRolls'])

        result = df.groupby('MenuIndex')['ProbProduct'].sum()
        P[current_idx, result.index.to_numpy()] = result.to_numpy()

    P = P / P.sum(axis=1, keepdims=True)

    # Compute the steady state probabilities using eigenvectors
    eigenvalues, eigenvectors = np.linalg.eig(P.T)
    ss_index = np.argmin(np.abs(eigenvalues - 1.0))
    steady_state = np.real(eigenvectors[:, ss_index] / np.sum(eigenvectors[:, ss_index]))

    # Compute marginal probabilities for each spell
    spell_probabilities = {spell: 0 for spell in spells}
    for menu, idx in menu_index.items():
        for spell in menu:
            spell_probabilities[spell] += steady_state[idx]

    print('Steady State Probabilities:')
    for spell, probability in spell_probabilities.items():
        print(f"{spell}: {probability:.6f}")

profiler = cProfile.Profile()
profiler.enable()

main()

profiler.disable()
stats = pstats.Stats(profiler).sort_stats('cumtime')
stats.print_stats()
