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

export async function loadFinishedMatches(indicator, forceRefresh = false) {
    if (!forceRefresh && indicator._lastFinishedFetchTimestamp && (Date.now() - indicator._lastFinishedFetchTimestamp < 300000)) {
        return;
    }

    try {
        let finishedMatchesJson = await api.fetchFinishedMatches();
        let fullList = (finishedMatchesJson && finishedMatchesJson.data)
            ? (Array.isArray(finishedMatchesJson.data)
                ? finishedMatchesJson.data
                : Object.values(finishedMatchesJson.data.tiers || {}).flatMap(tier => tier.matches || []))
            : [];

        if (fullList.length === 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yYear = yesterday.getFullYear();
            const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
            const yDay = String(yesterday.getDate()).padStart(2, '0');
            const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

            finishedMatchesJson = await api.fetchFinishedMatches(yesterdayStr);
            if (finishedMatchesJson && finishedMatchesJson.data) {
                fullList = Array.isArray(finishedMatchesJson.data)
                    ? finishedMatchesJson.data
                    : Object.values(finishedMatchesJson.data.tiers || {}).flatMap(tier => tier.matches || []);
            }
        }

        indicator.finishedCardsContainer.destroy_all_children();
        await load_menu.renderMatchesGrouped(indicator, indicator.finishedCardsContainer, fullList, finishedMatchesJson || {});
        indicator._lastFinishedFetchTimestamp = Date.now();
    } catch (e) {
        log(`Error fetching finished matches: ${e.message}`);
    }
}

export async function loadMatchDetails(indicator, slug) {
    try {
        const matchDetailsJson = await api.fetchMatchDetails(slug);

        if (matchDetailsJson) {
            return matchDetailsJson
        }
        return null;
    } catch (e) {
        log(`Error fetching match details: ${e.message}`);
        return null;
    }
}

export async function loadTeamDetails(indicator, teamName) {
    try {
        const teamDetailsJson = await api.fetchTeamDetails(teamName);

        if (teamDetailsJson) {
            return teamDetailsJson;
        }
        return null;
    } catch (e) {
        log(`Error fetching team details: ${e.message}`);
        return null;
    }
}