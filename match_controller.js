import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as api from './api.js';
import * as load_menu from './match_cards.js';

export async function loadMatches(indicator) {
    try {
        const matchesJson = await api.fetchMatches();

        indicator.liveCardsContainer.destroy_all_children();

        if (matchesJson && matchesJson.data && matchesJson.data.length > 0) {
            indicator.textoStatus.text = 'Live Matches';

            await load_menu.renderMatchesGrouped(indicator, indicator.liveCardsContainer, matchesJson.data, matchesJson);
        } else {

            const noGamesLabel = new St.Label({
                text: 'No games being played right now...',
                style_class: 'no_games_label',
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
            });

            indicator.liveCardsContainer.add_child(noGamesLabel);

            indicator.textoStatus.text = 'No games';
        }
    } catch (e) {
        log(`Failed to load matches: ${e.message}`);
        indicator.textoStatus.text = 'Error';
        indicator.menuTitleLabel.text = 'Failed to fetch API.';
    }
}

export async function loadFinishedMatches(indicator) {
    try {
        const finishedMatchesJson = await api.fetchFinishedMatches();

        indicator.finishedCardsContainer.destroy_all_children();

        if (finishedMatchesJson && finishedMatchesJson.data) {
            const fullList = Array.isArray(finishedMatchesJson.data)
                ? finishedMatchesJson.data
                : Object.values(finishedMatchesJson.data.tiers || {}).flatMap(tier => tier.matches || []);

            const matchesList = fullList;

            await load_menu.renderMatchesGrouped(indicator, indicator.finishedCardsContainer, matchesList, finishedMatchesJson);
        }
    } catch (e) {
        log(`Error fetching finished matches: ${e.message}`);
    }
}

export async function loadMatchDetails(indicator, slug) {
    try {
        const matchDetailsJson = await api.fetchMatchDetails(slug);

        if (matchDetailsJson) {
            indicator.textoStatus.text = 'DEU CERTO';
            return matchDetailsJson
        }
        return null;
    } catch (e) {
        log(`Error fetching match details: ${e.message}`);
        return null;
    }
}