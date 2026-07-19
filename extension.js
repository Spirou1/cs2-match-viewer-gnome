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
            this.menu.actor.style = 'width: 300px;';
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
            this.menuBoxLayout.add_child(this.menuTitleLabel);
            this.menuBoxLayout.add_child(divisor);
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
            this.menuBoxLayout.add_child(matchTitleContainer);

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

            this.menuBoxLayout.add_child(this.matchButton);
        }

        _buildDetailsSection() {
            this.detailBoxLayout = new St.BoxLayout({
                vertical: true,
                style: 'background-color: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 5px; spacing: 5px; margin-top: 5px;',
                visible: false,
            });
            this.detailMapLabel = new St.Label({ text: 'Map: Loading...' });
            this.detailTournamentLabel = new St.Label({ text: 'Tournament: Loading...' });
            this.detailFormatLabel = new St.Label({ text: 'Format: Loading...' });

            this.detailBoxLayout.add_child(this.detailMapLabel);
            this.detailBoxLayout.add_child(this.detailTournamentLabel);
            this.detailBoxLayout.add_child(this.detailFormatLabel);

            this.menuBoxLayout.add_child(this.detailBoxLayout);
        }

        _connectEvents() {
            this.matchButton.connect('clicked', () => {
                this.detailBoxLayout.visible = !this.detailBoxLayout.visible;
            });
        }

        async _loadMatches() {
            try {
                const matchesJson = await api.fetchMatches();

                if (matchesJson && matchesJson.data && matchesJson.data.length > 0) {
                    const match = matchesJson.data[0];
                    const team1 = matchesJson.included.teams[match.team1].name;
                    const team2 = matchesJson.included.teams[match.team2].name;

                    const team1Logo = matchesJson.included.teams[match.team1].image_versions['50x50'];
                    const team2Logo = matchesJson.included.teams[match.team2].image_versions['50x50'];

                    const dateObj = new Date(match.start_date);
                    const day = String(dateObj.getUTCDate()).padStart(2, '0');
                    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                    const year = dateObj.getUTCFullYear();
                    const date = `${day}-${month}-${year}`;

                    const team1Score = match.team1_last_game_score;
                    const team2Score = match.team2_last_game_score;

                    const mapName = match.live_updates ? match.live_updates.map_name : 'TBD';
                    const tournamentId = match.tournament;
                    const tournamentName = matchesJson.included.tournaments[tournamentId]
                        ? matchesJson.included.tournaments[tournamentId].name
                        : 'Unknown Tournament';
                    const format = `Best of ${match.bo_type} (MD${match.bo_type})`;

                    this.textoStatus.text = 'Live Matches';
                    this.team1Label.text = team1;
                    this.team1Score.text = String(team1Score);
                    this.team2Score.text = String(team2Score);
                    this.team2Label.text = team2;
                    this.dateLabel.text = date;

                    this.detailMapLabel.text = `Map: ${mapName}`;
                    this.detailTournamentLabel.text = `Tournament: ${tournamentName}`;
                    this.detailFormatLabel.text = `Format: ${format}`;

                    if (team1Logo) {
                        this.team1Icon.gicon = Gio.Icon.new_for_string(team1Logo);
                    }
                    if (team2Logo) {
                        this.team2Icon.gicon = Gio.Icon.new_for_string(team2Logo);
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
