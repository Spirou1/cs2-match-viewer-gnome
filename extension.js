/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as api from './api.js';
import { parseMatchMaps } from './utils.js';

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(extensionInstance) {
            super._init(0.0, _('My Shiny Indicator'));
            this._extension = extensionInstance;

            this._buildPanelIndicator();
            this._buildMenuBase();

            this.mainPage = new St.BoxLayout({ vertical: true });
            this.detailsPage = new St.BoxLayout({
                vertical: true,
                visible: false,
                style: 'padding: 10px;',
            });

            this.menuBoxLayout.add_child(this.mainPage);
            this.menuBoxLayout.add_child(this.detailsPage);

            this._buildHeader();

            const scrollView = new St.ScrollView({
                style: 'max-height: 350px;',
                hscrollbar_policy: St.PolicyType.NEVER,
                vscrollbar_policy: St.PolicyType.AUTOMATIC,
            });

            const scrollContent = new St.BoxLayout({ vertical: true });

            //creating live and finished matches containers
            this.liveCardsContainer = new St.BoxLayout({ vertical: true });
            this.finishedCardsContainer = new St.BoxLayout({ vertical: true, visible: false });

            scrollContent.add_child(this.liveCardsContainer);
            scrollContent.add_child(this.finishedCardsContainer);

            scrollView.set_child(scrollContent);
            this.mainPage.add_child(scrollView);

            this._buildDetailsSection();
            this._connectEvents();


            this._showLoadingState(this.liveCardsContainer, 'Loading live matches...');
            this._showLoadingState(this.finishedCardsContainer, 'Loading finished matches...');

            this._loadMatches();
            this._loadFinishedMatches();

            this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
                this._loadMatches();

                if (this.finishedCardsContainer.visible) {
                    this._loadFinishedMatches();
                }
                return GLib.SOURCE_CONTINUE;
            });

        }

        _buildPanelIndicator() {
            const container = new St.BoxLayout({});
            const icon = new St.Icon({
                icon_name: 'find-location-symbolic',
                style_class: 'system-status-icon',
            });
            this.textoStatus = new St.Label({
                text: 'Loading matches...',
                style_class: 'top_label',
                y_align: Clutter.ActorAlign.CENTER,
            });
            container.add_child(icon);
            container.add_child(this.textoStatus);
            this.add_child(container);
        }

        _buildMenuBase() {
            this.menu.actor.style = 'width: 480px;';
            this.mainMenuContainer = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                activate: false,
            });
            this.menuBoxLayout = new St.BoxLayout({
                vertical: true,
                style: 'spacing: 5px; padding: 10px;',
            });
            this.mainMenuContainer.add_child(this.menuBoxLayout);
            this.menu.addMenuItem(this.mainMenuContainer);
        }

        _buildHeader() {

            const headerContainer = new St.BoxLayout({
                y_align: Clutter.ActorAlign.CENTER,
            });


            const iconFile = this._extension.dir.get_child('assets').get_child('cs-logo.png');
            const headerIcon = new St.Widget({
                style_class: 'cs_logo_icon',
                style: `background-image: url("${iconFile.get_path()}"); width: 76px; height: 44px; margin-bottom: 5px;`,
                y_align: Clutter.ActorAlign.CENTER
            });

            this.menuTitleLabel = new St.Label({
                text: 'CS2 Match Viewer',
                style_class: 'menu_title_text',
                y_align: Clutter.ActorAlign.CENTER
            });

            headerContainer.add_child(headerIcon);
            headerContainer.add_child(this.menuTitleLabel);

            const divisor = new St.Widget({
                style: 'background-color: rgba(255, 255, 255, 0.15); height: 1px; margin: 10px 0;'
            });

            const tabsContainer = new St.BoxLayout({});

            this.liveTabButton = new St.Button({
                label: 'Live matches',
                reactive: true,
                can_focus: true,
                x_expand: true,
                style_class: 'tab_button tab_button_active',
            });

            this.finishedTabButton = new St.Button({
                label: 'Finished matches',
                reactive: true,
                can_focus: true,
                x_expand: true,
                style_class: 'tab_button',
            });

            tabsContainer.add_child(this.liveTabButton);
            tabsContainer.add_child(this.finishedTabButton);

            this.mainPage.add_child(headerContainer);
            this.mainPage.add_child(divisor);
            this.mainPage.add_child(tabsContainer);


            const matchTitleContainer = new St.BoxLayout({
                style: 'padding: 5px',
            });
            const teamTitle = new St.Label({
                text: 'Teams: ',
                style_class: 'team_title',
            });
            const spacer = new St.Widget({
                x_expand: true,
            });

            const dateTitle = new St.Label({
                text: 'Date: ',
                style_class: 'date_title',
            });
            matchTitleContainer.add_child(teamTitle);
            matchTitleContainer.add_child(spacer);
            matchTitleContainer.add_child(dateTitle);
            this.mainPage.add_child(matchTitleContainer);
        }

        _createMatchCard(match, matchesJson) {
            const iconFile = this._extension.dir.get_child('assets').get_child('cs-logo.png');
            const placeholderPath = iconFile.get_path();

            const team1name = matchesJson.included?.teams?.[match.team1]?.name || 'Unknown Team 1';
            const team2name = matchesJson.included?.teams?.[match.team2]?.name || 'Unknown Team 2';
            const team1Logo = matchesJson.included?.teams?.[match.team1]?.image_versions?.['50x50'] || null;
            const team2Logo = matchesJson.included?.teams?.[match.team2]?.image_versions?.['50x50'] || null;

            const team1RoundScore = match.team1_last_game_score ?? '-';
            const team2RoundScore = match.team2_last_game_score ?? '-';
            const team1MapScore = match.team1_score ?? '(-)';
            const team2MapScore = match.team2_score ?? '(-)';

            const team1ScoreText = `(${team1MapScore}) ${team1RoundScore}`;
            const team2ScoreText = `(${team2MapScore}) ${team2RoundScore}`;

            const dateObj = new Date(match.start_date);
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const year = dateObj.getUTCFullYear();
            const date = `${day}-${month}-${year}`;

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
            const team1Icon = new St.Widget({
                style_class: 'team_icon',
                style: team1Logo
                    ? `background-image: url("${team1Logo}");`
                    : `background-image: url("${placeholderPath}");`,
                y_align: Clutter.ActorAlign.CENTER,
            });

            const team1ScoreLabel = new St.Label({
                text: String(team1ScoreText),
                style_class: 'score',
                y_align: Clutter.ActorAlign.CENTER,
            });
            const team2Label = new St.Label({
                text: team2name,
                style_class: 'team_name',
                y_align: Clutter.ActorAlign.CENTER,
            });
            const team2Icon = new St.Widget({
                style_class: 'team_icon',
                style: team2Logo
                    ? `background-image: url("${team2Logo}");`
                    : `background-image: url("${placeholderPath}");`,
                y_align: Clutter.ActorAlign.CENTER,
            });

            const team2ScoreLabel = new St.Label({
                text: String(team2ScoreText),
                style_class: 'score',
                y_align: Clutter.ActorAlign.CENTER,
            });
            const dateLabel = new St.Label({
                text: date,
                style_class: 'date_text',
                y_align: Clutter.ActorAlign.CENTER,
            });
            const scoreDivisor = new St.Label({
                text: '  X  ',
                y_align: Clutter.ActorAlign.CENTER,
            });

            const spacer = new St.Widget({
                x_expand: true,
            });

            matchBoxLayout.add_child(team1Icon);
            matchBoxLayout.add_child(team1Label);
            matchBoxLayout.add_child(team1ScoreLabel);
            matchBoxLayout.add_child(scoreDivisor);
            matchBoxLayout.add_child(team2ScoreLabel);
            matchBoxLayout.add_child(team2Icon);
            matchBoxLayout.add_child(team2Label);
            matchBoxLayout.add_child(spacer);
            matchBoxLayout.add_child(dateLabel);

            //on click to show details page
            matchButton.connect('clicked', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    const tournamentId = match.tournament;
                    const tournamentName = matchesJson.included?.tournaments?.[tournamentId]?.name || 'Unknown Tournament';
                    const tournamentLogo = matchesJson.included?.tournaments?.[match.tournament]?.image_url || null;
                    const team1LogoDetail = matchesJson.included?.teams?.[match.team1]?.image_url || null;
                    const team2LogoDetail = matchesJson.included?.teams?.[match.team2]?.image_url || null;

                    //maps array
                    // log(`Mapa ${game.number}: ${game.map_name} - Status: ${game.status}`);
                    const maps = parseMatchMaps(match);

                    if (maps) {
                        this.map1Detail.text = maps[0]?.map_name || '-';
                        this.map2Detail.text = maps[1]?.map_name || '-';
                        this.map3Detail.text = maps[2]?.map_name || '-';
                    }

                    this.tournamentNameDetail.text = tournamentName;
                    this.team1NameDetail.text = team1name;
                    this.team2NameDetail.text = team2name;
                    this.team1ScoreDetail.text = String(team1ScoreText);
                    this.team2ScoreDetail.text = String(team2ScoreText);

                    const iconFile = this._extension.dir.get_child('assets').get_child('cs-logo.png');
                    const placeholderPath = iconFile.get_path();

                    if (tournamentLogo) {
                        this.tournamentLogo.style = `background-image: url("${tournamentLogo}");`;
                    } else {
                        this.tournamentLogo.style = `background-image: url("${placeholderPath}");`;
                    }

                    if (team1LogoDetail) {
                        this.team1IconDetail.style = `background-image: url("${team1LogoDetail}");`;
                    } else {
                        this.team1IconDetail.style = `background-image: url("${placeholderPath}");`;
                    }

                    if (team2LogoDetail) {
                        this.team2IconDetail.style = `background-image: url("${team2LogoDetail}");`;
                    } else {
                        this.team2IconDetail.style = `background-image: url("${placeholderPath}");`;
                    }

                    this.mainPage.visible = false;
                    this.detailsPage.visible = true;
                    return GLib.SOURCE_REMOVE;
                });
            });

            return matchButton;
        }

        _buildDetailsSection() {
            this.backButtonLabelContainer = new St.BoxLayout({ x_expand: true })

            this.backButton = new St.Button({
                reactive: true,
                can_focus: true,
                x_expand: false,
                x_align: Clutter.ActorAlign.START,
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'back_button',
            });

            const backButtonIcon = new St.Icon({
                icon_name: 'pan-start-symbolic',
            });

            this.backButton.set_child(backButtonIcon)

            this.detailContentLabel = new St.Label({
                text: 'Detailed view:',
                style_class: 'detail_content_label',
                y_align: Clutter.ActorAlign.CENTER,
            });

            const divisor = new St.Widget({
                style: 'background-color: rgba(255, 255, 255, 0.15); height: 1px; margin: 10px 0;'
            });

            this.tournamentLogoLabelContainer = new St.BoxLayout({
                vertical: true,
                x_expand: true,
                style_class: 'tournament_logo_label',
            });

            this.tournamentLogo = new St.Widget({
                style_class: 'tournament_logo',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.tournamentNameDetail = new St.Label({
                text: '',
                style_class: 'tournament_name_detail',
            });

            this.teamsLogosDetailContainer = new St.BoxLayout({
                x_expand: true,
            });

            this.team1ContainerDetail = new St.BoxLayout({
                vertical: true,
                x_expand: true,
            });

            this.team1IconDetail = new St.Widget({
                style_class: 'team_logo_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team1NameDetail = new St.Label({
                text: 'Unknown team',
                style_class: 'team_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team1ScoreDetail = new St.Label({
                text: '-',
                style_class: 'team_score_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team2ContainerDetail = new St.BoxLayout({
                vertical: true,
                x_expand: true,
            })

            this.team2IconDetail = new St.Widget({
                style_class: 'team_logo_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team2NameDetail = new St.Label({
                text: 'Unknown team',
                style_class: 'team_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team2ScoreDetail = new St.Label({
                text: '-',
                style_class: 'team_score_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.mapsContainer = new St.BoxLayout({
                vertical: true,
                x_expand: true,
                style_class: 'maps_container',
            });

            const mapContainerTitle = new St.Label({
                text: 'Maps:',
                style_class: 'maps_container_title',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.map1Detail = new St.Label({
                text: 'TBD',
                style_class: 'map_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.map2Detail = new St.Label({
                text: 'TBD',
                style_class: 'map_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.map3Detail = new St.Label({
                text: 'TBD',
                style_class: 'map_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            const spacer = new St.Widget({
                x_expand: true,
            });

            this.team1ContainerDetail.add_child(this.team1IconDetail);
            this.team1ContainerDetail.add_child(this.team1NameDetail);
            this.team1ContainerDetail.add_child(this.team1ScoreDetail);
            this.team2ContainerDetail.add_child(this.team2IconDetail);
            this.team2ContainerDetail.add_child(this.team2NameDetail);
            this.team2ContainerDetail.add_child(this.team2ScoreDetail);

            this.teamsLogosDetailContainer.add_child(this.team1ContainerDetail);
            this.teamsLogosDetailContainer.add_child(spacer);
            this.teamsLogosDetailContainer.add_child(this.team2ContainerDetail);


            this.backButtonLabelContainer.add_child(this.backButton);
            this.backButtonLabelContainer.add_child(this.detailContentLabel);

            this.tournamentLogoLabelContainer.add_child(this.tournamentLogo);
            this.tournamentLogoLabelContainer.add_child(this.tournamentNameDetail);

            this.mapsContainer.add_child(mapContainerTitle);
            this.mapsContainer.add_child(this.map1Detail);
            this.mapsContainer.add_child(this.map2Detail);
            this.mapsContainer.add_child(this.map3Detail);

            this.detailsPage.add_child(this.backButtonLabelContainer);
            this.detailsPage.add_child(divisor);
            this.detailsPage.add_child(this.tournamentLogoLabelContainer);
            this.detailsPage.add_child(this.teamsLogosDetailContainer);
            this.detailsPage.add_child(this.mapsContainer);
        }

        _connectEvents() {
            this.backButton.connect('clicked', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this.mainPage.visible = true;
                    this.detailsPage.visible = false;
                    return GLib.SOURCE_REMOVE;
                });
            });

            this.liveTabButton.connect('clicked', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this.liveTabButton.add_style_class_name('tab_button_active');
                    this.finishedTabButton.remove_style_class_name('tab_button_active');

                    this.liveCardsContainer.visible = true;
                    this.finishedCardsContainer.visible = false;
                    return GLib.SOURCE_REMOVE;
                });
            });

            this.finishedTabButton.connect('clicked', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this.finishedTabButton.add_style_class_name('tab_button_active');
                    this.liveTabButton.remove_style_class_name('tab_button_active');

                    this.liveCardsContainer.visible = false;
                    this.finishedCardsContainer.visible = true;

                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        async _loadMatches() {
            try {
                //making the api call
                const matchesJson = await api.fetchMatches();

                this.liveCardsContainer.destroy_all_children();

                if (matchesJson && matchesJson.data && matchesJson.data.length > 0) {
                    this.textoStatus.text = 'Live Matches';

                    //gathering each match from the data field
                    matchesJson.data.forEach((match, index) => {
                        const matchCard = this._createMatchCard(match, matchesJson);
                        this.liveCardsContainer.add_child(matchCard);

                        if (index < matchesJson.data.length - 1) {
                            const cardDivisor = new St.Widget({
                                style: 'background-color: rgba(255, 255, 255, 0.1); height: 1px; margin: 8px 0;'
                            });
                            this.liveCardsContainer.add_child(cardDivisor);
                        }
                    });
                } else {
                    this.textoStatus.text = 'No games';
                    this.menuTitleLabel.text = 'There are no games right now...';
                }
            } catch (e) {
                log(`Erro ao carregar partidas no painel: ${e.message}`);
                this.textoStatus.text = 'Error';
                this.menuTitleLabel.text = 'Failed to fetch API.';
            }
        }

        async _loadFinishedMatches() {
            try {
                const finishedMatchesJson = await api.fetchFinishedMatches();

                this.finishedCardsContainer.destroy_all_children();

                if (finishedMatchesJson && finishedMatchesJson.data) {
                    const fullList = Array.isArray(finishedMatchesJson.data)
                        ? finishedMatchesJson.data
                        : Object.values(finishedMatchesJson.data.tiers || {}).flatMap(tier => tier.matches || []);

                    const matchesList = fullList.slice(0, 5);

                    matchesList.forEach((match, index) => {
                        const matchCard = this._createMatchCard(match, finishedMatchesJson);
                        this.finishedCardsContainer.add_child(matchCard);

                        if (index < matchesList.length - 1) {
                            const cardDivisor = new St.Widget({
                                style: 'background-color: rgba(255, 255, 255, 0.1); height: 1px; margin: 8px 0;'
                            });
                            this.finishedCardsContainer.add_child(cardDivisor);
                        }
                    });
                }
            } catch (e) {
                log(`Error fetching finished matches: ${e.message}`);
            }
        }

        _showLoadingState(container, messageText) {
            container.destroy_all_children();
            const loadingLabel = new St.Label({
                text: messageText || 'Carregando partidas...',
                style_class: 'loading_label',
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                style: 'padding: 20px; color: #888; font-style: italic;',
            });
            container.add_child(loadingLabel);
        }

    });

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
