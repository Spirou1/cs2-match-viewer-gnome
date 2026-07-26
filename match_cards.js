import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

import * as load_matches from './match_controller.js';
import { parseMatchMaps, getCachedImageUri } from './utils.js';

export function groupMatchesByTournament(matchesList) {
    if (!Array.isArray(matchesList)) return {};

    return matchesList.reduce((acc, match) => {
        const tournamentId = match.tournament || 'unknown';
        if (!acc[tournamentId]) {
            acc[tournamentId] = [];
        }
        acc[tournamentId].push(match);
        return acc;
    }, {});
}

export async function renderMatchesGrouped(indicator, container, matchesList, matchesJson) {
    container.destroy_all_children();

    const grouped = groupMatchesByTournament(matchesList);

    const tierPriority = { 's': 1, 'a': 2, 'b': 3, 'c': 4, 'd': 5 };

    const sortedGrouped = Object.entries(grouped).sort(([tIdA, matchesA], [tIdB, matchesB]) => {
        const tierA = (matchesJson.included?.tournaments?.[tIdA]?.tier || matchesA[0]?.tier || 'z').toLowerCase();
        const tierB = (matchesJson.included?.tournaments?.[tIdB]?.tier || matchesB[0]?.tier || 'z').toLowerCase();
        return (tierPriority[tierA] ?? 99) - (tierPriority[tierB] ?? 99);
    });

    for (const [tournamentId, matches] of sortedGrouped) {
        const tournament = matchesJson.included?.tournaments?.[tournamentId];
        const tournamentName = tournament?.name || 'Unknown Tournament';
        const tournamentLogo = tournament?.image_versions?.['50x50'] || tournament?.image_url || null;

        const logoUri = tournamentLogo ? await getCachedImageUri(tournamentLogo) : null;

        const headerBox = new St.BoxLayout({
            style: 'padding: 8px 5px 4px 5px; margin-top: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);',
            y_align: Clutter.ActorAlign.CENTER,
        });

        if (logoUri) {
            const logoWidget = new St.Widget({
                style_class: 'small_tournament_icon',
                style: `background-image: url("${logoUri}"); margin-right: 8px; width: 22px; height: 22px;`,
                y_align: Clutter.ActorAlign.CENTER,
            });
            headerBox.add_child(logoWidget);
        }

        const titleLabel = new St.Label({
            text: tournamentName,
            style: 'font-weight: bold; font-size: 13px; color: #d98518;',
            y_align: Clutter.ActorAlign.CENTER,
        });
        headerBox.add_child(titleLabel);

        container.add_child(headerBox);

        for (let index = 0; index < matches.length; index++) {
            const matchCard = await createMatchCard(indicator, matches[index], matchesJson);
            container.add_child(matchCard);

            if (index < matches.length - 1) {
                const cardDivisor = new St.Widget({
                    style: 'background-color: rgba(255, 255, 255, 0.05); height: 1px; margin: 4px 0;'
                });
                container.add_child(cardDivisor);
            }
        }
    }
}


export async function createMatchCard(indicator, match, matchesJson) {
    const iconFile = indicator._extension.dir.get_child('assets').get_child('default-team-logo.png');
    const placeholderPath = iconFile.get_path();

    const team1name = matchesJson.included?.teams?.[match.team1]?.name || 'Unknown Team 1';
    const team2name = matchesJson.included?.teams?.[match.team2]?.name || 'Unknown Team 2';
    const team1Logo = matchesJson.included?.teams?.[match.team1]?.image_versions?.['50x50'] || null;
    const team2Logo = matchesJson.included?.teams?.[match.team2]?.image_versions?.['50x50'] || null;

    const tournamentLogoSmall = matchesJson.included?.tournaments?.[match.tournament]?.image_versions?.['50x50'] || null;

    const [team1LocalUri, team2LocalUri, smallTournamentLogoLocalUri] = await Promise.all([
        getCachedImageUri(team1Logo),
        getCachedImageUri(team2Logo),
        getCachedImageUri(tournamentLogoSmall),
    ]);

    const team1RoundScore = match.team1_last_game_score ?? '-';
    const team2RoundScore = match.team2_last_game_score ?? '-';
    const team1MapScore = match.team1_score ?? '(-)';
    const team2MapScore = match.team2_score ?? '(-)';

    const team1ScoreText = `(${team1MapScore}) ${team1RoundScore}`;
    const team2ScoreText = `${team2RoundScore} (${team2MapScore})`;

    let team1Class = 'score_tie';
    let team2Class = 'score_tie';
    let team1DetailClass = 'team_score_detail_tie';
    let team2DetailClass = 'team_score_detail_tie'

    if (team1MapScore > team2MapScore) {
        team1Class = 'score_win';
        team1DetailClass = 'team_score_detail_win';
        team2Class = 'score_lose';
        team2DetailClass = 'team_score_detail_lose';
    } else if (team1MapScore < team2MapScore) {
        team1Class = 'score_lose';
        team1DetailClass = 'team_score_detail_lose';
        team2Class = 'score_win';
        team2DetailClass = 'team_score_detail_win';
    } else if (team1RoundScore > team2RoundScore) {
        team1Class = 'score_win';
        team1DetailClass = 'team_score_detail_win';
        team2Class = 'score_lose';
        team2DetailClass = 'team_score_detail_lose';
    } else if (team1RoundScore < team2RoundScore) {
        team1Class = 'score_lose';
        team1DetailClass = 'team_score_detail_lose';
        team2Class = 'score_win';
        team2DetailClass = 'team_score_detail_win';
    }

    const boType = match.bo_type ? `BO${match.bo_type}` : 'BO1';
    const tierRaw = (matchesJson.included?.tournaments?.[match.tournament]?.tier || match.tier || 'C').toUpperCase();
    const formatText = `${boType} • Tier ${tierRaw}`;

    const matchButton = new St.Button({
        reactive: true,
        can_focus: true,
        x_expand: true,
        style_class: 'match_button',
    });

    const matchBoxLayout = new St.BoxLayout({
        style: 'padding: 5px',
        x_expand: true,
    });

    matchButton.set_child(matchBoxLayout);

    const team1Label = new St.Label({
        text: team1name,
        style_class: 'team_name',
        y_align: Clutter.ActorAlign.CENTER,
    });
    team1Label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

    const team1Icon = new St.Widget({
        style_class: 'team_icon',
        style: team1LocalUri
            ? `background-image: url("${team1LocalUri}");`
            : `background-image: url("${placeholderPath}");`,
        y_align: Clutter.ActorAlign.CENTER,
    });

    const team1ScoreLabel = new St.Label({
        text: String(team1ScoreText),
        style_class: `score ${team1Class}`,
        y_align: Clutter.ActorAlign.CENTER,
    });
    const team2Label = new St.Label({
        text: team2name,
        style_class: 'team_name',
        y_align: Clutter.ActorAlign.CENTER,
    });
    team2Label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

    const team2Icon = new St.Widget({
        style_class: 'team_icon',
        style: team2LocalUri
            ? `background-image: url("${team2LocalUri}");`
            : `background-image: url("${placeholderPath}");`,
        y_align: Clutter.ActorAlign.CENTER,
    });

    const team2ScoreLabel = new St.Label({
        text: String(team2ScoreText),
        style_class: `score ${team2Class}`,
        y_align: Clutter.ActorAlign.CENTER,
    });

    const scoreDivisor = new St.Label({
        text: '  X  ',
        y_align: Clutter.ActorAlign.CENTER,
    });

    const teamsContainer = new St.BoxLayout({
        style: 'width: 400px;',
        y_align: Clutter.ActorAlign.CENTER,
    })

    teamsContainer.add_child(team1Icon);
    teamsContainer.add_child(team1Label);
    teamsContainer.add_child(team1ScoreLabel);
    teamsContainer.add_child(scoreDivisor);
    teamsContainer.add_child(team2ScoreLabel);
    teamsContainer.add_child(team2Icon);
    teamsContainer.add_child(team2Label);

    const formatLabel = new St.Label({
        text: formatText,
        style_class: 'format_text',
        y_align: Clutter.ActorAlign.CENTER,
    });

    const formatContainer = new St.BoxLayout({
        x_expand: true,
        x_align: Clutter.ActorAlign.END,
        y_align: Clutter.ActorAlign.CENTER,
    });

    formatContainer.add_child(formatLabel);

    const smallTournamentIcon = new St.Widget({
        style_class: 'small_tournament_icon',
        style: smallTournamentLogoLocalUri
            ? `background-image: url("${smallTournamentLogoLocalUri}");`
            : `background-image: url("${placeholderPath}");`,
        y_align: Clutter.ActorAlign.CENTER,
    });

    const tournamentContainer = new St.BoxLayout({
        style: 'width: 60px; padding-left: 10px;',
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
    });
    tournamentContainer.add_child(smallTournamentIcon);

    matchBoxLayout.add_child(teamsContainer);
    matchBoxLayout.add_child(tournamentContainer);
    matchBoxLayout.add_child(formatContainer);

    matchButton.connect('clicked', async () => {
        const tournamentId = match.tournament;
        const tournamentName = matchesJson.included?.tournaments?.[tournamentId]?.name || 'Unknown Tournament';
        const tournamentLogo = matchesJson.included?.tournaments?.[match.tournament]?.image_url || null;
        const team1LogoDetail = matchesJson.included?.teams?.[match.team1]?.image_url || null;
        const team2LogoDetail = matchesJson.included?.teams?.[match.team2]?.image_url || null;

        const matchSlug = match.slug;

        const matchDetailJson = await load_matches.loadMatchDetails(indicator, matchSlug);

        if (matchDetailJson) {
            const detailSlug = matchDetailJson.slug;
            indicator.testSlug.text = `${detailSlug}`;
        }

        Promise.all([
            getCachedImageUri(tournamentLogo),
            getCachedImageUri(team1LogoDetail),
            getCachedImageUri(team2LogoDetail),
        ]).then(([tLogoUri, t1LogoUri, t2LogoUri]) => {
            indicator.mapsContainer.destroy_all_children();

            const boType = match.bo_type ? `BO${match.bo_type}` : 'Maps';
            const mapContainerTitle = new St.Label({
                text: `Maps (${boType}):`,
                style_class: 'maps_container_title',
                x_align: Clutter.ActorAlign.CENTER,
                style: 'font-weight: bold; margin-bottom: 8px;',
            });
            indicator.mapsContainer.add_child(mapContainerTitle);

            const maps = parseMatchMaps(match);

            if (maps && maps.length > 0) {
                maps.forEach((game) => {
                    const mapName = game.map_name ? game.map_name.replace('de_', '').toUpperCase() : 'TBD';
                    let scoreText = '';
                    let statusText = '';

                    if (game.status === 'current') {
                        const r1 = match.team1_last_game_score ?? '-';
                        const r2 = match.team2_last_game_score ?? '-';
                        scoreText = ` (${r1} - ${r2})`;
                        statusText = ' (Current)';
                    } else if (game.status === 'finished') {
                        statusText = ' (Finished)';
                    } else if (game.status === 'upcoming') {
                        statusText = ' (Upcoming)';
                    }

                    const mapLabel = new St.Label({
                        text: `Map ${game.number}: ${mapName}${scoreText}${statusText}`,
                        style_class: 'map_name_detail',
                        x_align: Clutter.ActorAlign.CENTER,
                    });

                    indicator.mapsContainer.add_child(mapLabel);
                });
            } else {
                const noMapsLabel = new St.Label({
                    text: 'No maps defined yet',
                    style_class: 'map_name_detail',
                    x_align: Clutter.ActorAlign.CENTER,
                });
                indicator.mapsContainer.add_child(noMapsLabel);
            }

            if (match.start_date) {
                const dateObj = new Date(match.start_date);
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const year = dateObj.getUTCFullYear();
                const hours = String(dateObj.getUTCHours()).padStart(2, '0');
                const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
                indicator.matchDateDetail.text = `Date: ${day}-${month}-${year} ${hours}:${minutes} UTC`;
            } else {
                indicator.matchDateDetail.text = '';
            }

            indicator.tournamentNameDetail.text = tournamentName;
            indicator.team1NameDetail.text = team1name;
            indicator.team2NameDetail.text = team2name;
            indicator.team1ScoreDetail.text = String(team1ScoreText);
            indicator.team2ScoreDetail.text = String(team2ScoreText);

            indicator.team1ScoreDetail.style_class = `team_score_detail ${team1DetailClass}`;
            indicator.team2ScoreDetail.style_class = `team_score_detail ${team2DetailClass}`;

            indicator.tournamentLogo.style = `background-image: url("${tLogoUri || placeholderPath}");`;
            indicator.team1IconDetail.style = `background-image: url("${t1LogoUri || placeholderPath}");`;
            indicator.team2IconDetail.style = `background-image: url("${t2LogoUri || placeholderPath}");`;

            indicator.mainPage.visible = false;
            indicator.detailsPage.visible = true;
        });
    });

    return matchButton;
}

export function showLoadingState(indicator, container, messageText) {
    container.destroy_all_children();
    const loadingLabel = new St.Label({
        text: messageText || 'Loading matches...',
        style_class: 'loading_label',
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
        style: 'padding: 20px; color: #888; font-style: italic;',
    });
    container.add_child(loadingLabel);
}