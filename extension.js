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
import * as utils from './utils.js';

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init() {
            super._init(0.0, _('My Shiny Indicator'));

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
            this._buildMatchCard();
            this._buildDetailsSection();
            this._connectEvents();
            this._loadMatches();
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
            this.menuTitleLabel = new St.Label({
                text: 'Live matches right now:',
                style_class: 'menu_title_text',
            });
            const divisor = new St.Widget({
                style: 'background-color: rgba(255, 255, 255, 0.15); height: 1px; margin: 10px 0;'
            });
            this.mainPage.add_child(this.menuTitleLabel);
            this.mainPage.add_child(divisor);
        }

        _buildMatchCard() {
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

            this.matchButton = new St.Button({
                reactive: true,
                can_focus: true,
                x_expand: true,
                style_class: 'match_button',
            });

            const matchBoxLayout = new St.BoxLayout({
                style: 'padding: 5px',
                x_expand: true,
            });

            this.matchButton.set_child(matchBoxLayout);

            this.team1Label = new St.Label({
                text: 'No teams playing right now...',
                style_class: 'team_name',
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.team1Icon = new St.Icon({
                icon_size: 20,
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'team_icon'
            });
            this.team1Score = new St.Label({
                text: '(0)',
                style_class: 'score',
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.team2Label = new St.Label({
                text: '',
                style_class: 'team_name',
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.team2Icon = new St.Icon({
                icon_size: 20,
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'team_icon'
            });
            this.team2Score = new St.Label({
                text: '',
                style_class: 'score',
                y_align: Clutter.ActorAlign.CENTER,
            });
            this.dateLabel = new St.Label({
                text: '',
                style_class: 'date_text',
                y_align: Clutter.ActorAlign.CENTER,
            });
            const scoreDivisor = new St.Label({
                text: '  X  ',
                y_align: Clutter.ActorAlign.CENTER,
            });

            matchBoxLayout.add_child(this.team1Icon);
            matchBoxLayout.add_child(this.team1Label);
            matchBoxLayout.add_child(this.team1Score);
            matchBoxLayout.add_child(scoreDivisor);
            matchBoxLayout.add_child(this.team2Score);
            matchBoxLayout.add_child(this.team2Icon);
            matchBoxLayout.add_child(this.team2Label);
            matchBoxLayout.add_child(this.dateLabel);

            this.mainPage.add_child(this.matchButton);
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

            this.tournamentLogoLabelContainer = new St.BoxLayout({
                vertical: true,
                x_expand: true,
            });

            this.tournamentLogo = new St.Icon({
                style_class: 'tournament_logo',
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

            this.team1IconDetail = new St.Icon({
                style_class: 'team_logo_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team1NameDetail = new St.Label({
                text: 'Unknown team',
                style_class: 'team_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team2ContainerDetail = new St.BoxLayout({
                vertical: true,
                x_expand: true,
            })

            this.team2IconDetail = new St.Icon({
                style_class: 'team_logo_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team2NameDetail = new St.Label({
                text: 'Unknown team',
                style_class: 'team_name_detail',
                x_align: Clutter.ActorAlign.CENTER,
            });

            this.team1ContainerDetail.add_child(this.team1IconDetail);
            this.team1ContainerDetail.add_child(this.team1NameDetail);
            this.team2ContainerDetail.add_child(this.team2IconDetail);
            this.team2ContainerDetail.add_child(this.team2NameDetail);

            this.teamsLogosDetailContainer.add_child(this.team1ContainerDetail);
            this.teamsLogosDetailContainer.add_child(this.team2ContainerDetail);


            this.backButtonLabelContainer.add_child(this.backButton);
            this.backButtonLabelContainer.add_child(this.detailContentLabel);

            this.tournamentLogoLabelContainer.add_child(this.tournamentLogo);
            this.tournamentLogoLabelContainer.add_child(this.tournamentNameDetail);

            this.detailsPage.add_child(this.backButtonLabelContainer);
            this.detailsPage.add_child(this.tournamentLogoLabelContainer);
            this.detailsPage.add_child(this.teamsLogosDetailContainer);
        }

        _connectEvents() {
            this.matchButton.connect('clicked', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this.mainPage.visible = false;
                    this.detailsPage.visible = true;
                    return GLib.SOURCE_REMOVE;
                });
            });

            this.backButton.connect('clicked', () => {
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this.mainPage.visible = true;
                    this.detailsPage.visible = false;
                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        async _loadMatches() {
            try {
                const matchesJson = await api.fetchMatches();

                if (matchesJson && matchesJson.data && matchesJson.data.length > 0) {
                    //team names, scores and logos
                    const match = matchesJson.data[0];
                    const team1name = matchesJson.included.teams[match.team1].name;
                    const team2name = matchesJson.included.teams[match.team2].name;
                    const team1Logo = matchesJson.included.teams[match.team1].image_versions['50x50'];
                    const team2Logo = matchesJson.included.teams[match.team2].image_versions['50x50'];

                    const team1Score = match.team1_last_game_score;
                    const team2Score = match.team2_last_game_score;

                    //formatting date
                    const dateObj = new Date(match.start_date);
                    const day = String(dateObj.getUTCDate()).padStart(2, '0');
                    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                    const year = dateObj.getUTCFullYear();
                    const date = `${day}-${month}-${year}`;

                    //details section stuff
                    const mapName = match.live_updates ? match.live_updates.map_name : 'TBD';
                    const tournamentId = match.tournament;
                    const tournamentName = matchesJson.included.tournaments[tournamentId]
                        ? matchesJson.included.tournaments[tournamentId].name
                        : 'Unknown Tournament';
                    const tournamentLogo = matchesJson.included.tournaments[match.tournament].image_url;
                    const team1LogoDetail = matchesJson.included.teams[match.team1].image_url;
                    const team2LogoDetail = matchesJson.included.teams[match.team2].image_url;

                    this.textoStatus.text = 'Live Matches';
                    this.team1Label.text = team1name;
                    this.team1Score.text = String(team1Score);
                    this.team2Score.text = String(team2Score);
                    this.team2Label.text = team2name;
                    this.dateLabel.text = date;
                    this.tournamentNameDetail.text = tournamentName;
                    this.team1NameDetail.text = team1name;
                    this.team2NameDetail.text = team2name;

                    if (team1Logo) {
                        this.team1Icon.gicon = Gio.Icon.new_for_string(team1Logo);
                    }
                    if (team2Logo) {
                        this.team2Icon.gicon = Gio.Icon.new_for_string(team2Logo);
                    }
                    if (tournamentLogo) {
                        this.tournamentLogo.gicon = Gio.Icon.new_for_string(tournamentLogo);
                    }
                    if (team1LogoDetail) {
                            this.team1IconDetail.gicon = Gio.Icon.new_for_string(team1LogoDetail);
                    }
                    if (team2LogoDetail) {
                        this.team2IconDetail.gicon = Gio.Icon.new_for_string(team2LogoDetail);
                    }

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
    });

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
