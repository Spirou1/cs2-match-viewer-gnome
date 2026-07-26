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
import GLib from 'gi://GLib';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as load_matches from './src/match_controller.js';
import * as build_menu from './src/build_menu.js';

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(extensionInstance) {
            super._init(0.0, _('My Shiny Indicator'));
            this._extension = extensionInstance;

            build_menu.buildPanelIndicator(this);
            build_menu.buildMenuBase(this);

            this.mainPage = new St.BoxLayout({ vertical: true });
            this.detailsPage = new St.BoxLayout({
                vertical: true,
                visible: false,
                style: 'padding: 10px;',
            });

            this.menuBoxLayout.add_child(this.mainPage);
            this.menuBoxLayout.add_child(this.detailsPage);

            build_menu.buildHeader(this);

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

            build_menu.buildDetailsSection(this);
            this._connectEvents();


            load_matches.loadMatches(this);
            load_matches.loadFinishedMatches(this);

            this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
                load_matches.loadMatches(this);

                if (this.finishedCardsContainer.visible) {
                    load_matches.loadFinishedMatches(this);
                }
                return GLib.SOURCE_CONTINUE;
            });

        }

        _connectEvents() {
            this.backButton.connect('clicked', () => {
                this.mainPage.visible = true;
                this.detailsPage.visible = false;
            });

            this.liveTabButton.connect('clicked', () => {
                this.liveTabButton.add_style_class_name('tab_button_active');
                this.finishedTabButton.remove_style_class_name('tab_button_active');

                this.liveCardsContainer.visible = true;
                this.finishedCardsContainer.visible = false;
            });

            this.finishedTabButton.connect('clicked', () => {
                this.finishedTabButton.add_style_class_name('tab_button_active');
                this.liveTabButton.remove_style_class_name('tab_button_active');

                this.liveCardsContainer.visible = false;
                this.finishedCardsContainer.visible = true;
            });
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
