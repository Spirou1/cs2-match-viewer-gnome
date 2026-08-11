import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CS2MatchViewerPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Tier Filters'),
            description: _('Select which tournament tiers to display in match lists'),
        });
        page.add(group);

        const tiers = [
            { key: 'show-tier-s', title: _('Tier S'), subtitle: _('Show Tier S tournaments') },
            { key: 'show-tier-a', title: _('Tier A'), subtitle: _('Show Tier A tournaments') },
            { key: 'show-tier-b', title: _('Tier B'), subtitle: _('Show Tier B tournaments') },
            { key: 'show-tier-c', title: _('Tier C'), subtitle: _('Show Tier C tournaments') },
            { key: 'show-tier-d', title: _('Tier D and Others'), subtitle: _('Show Tier D and unclassified tournaments') },
        ];

        for (const tier of tiers) {
            const row = new Adw.SwitchRow({
                title: tier.title,
                subtitle: tier.subtitle,
            });
            group.add(row);

            settings.bind(tier.key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        }

        const aboutGroup = new Adw.PreferencesGroup({
            title: _('About'),
            description: _('Project information'),
        });
        page.add(aboutGroup);

        const repoRow = new Adw.ActionRow({
            title: _('Repository'),
            subtitle: _('https://github.com/Spirou1/cs2-match-viewer-gnome'),
        });
        aboutGroup.add(repoRow);

        const infoRow = new Adw.ActionRow({
            title: _('Information'),
            subtitle: _('This project is developed using the bo3.gg API. This API may not always return the most accurate and up to date information; because of that, some matches might not have live round coverage and some team lineups may also be incorrect.\n\nThis project is still in development so please, feel free to give some advice or feedback if you want!'),
            subtitle_lines: 0,
        });
        aboutGroup.add(infoRow);
    }
}
