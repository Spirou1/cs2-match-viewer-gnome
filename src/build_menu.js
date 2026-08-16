import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export function buildPanelIndicator(indicator) {
    const container = new St.BoxLayout({});
    const icon = new St.Icon({
        icon_name: 'find-location-symbolic',
        style_class: 'system-status-icon',
    });
    indicator.textStatus = new St.Label({
        text: 'Loading matches...',
        style_class: 'top_label',
        y_align: Clutter.ActorAlign.CENTER,
    });
    container.add_child(icon);
    container.add_child(indicator.textStatus);
    indicator.add_child(container);
}

export function buildMenuBase(indicator) {
    indicator.menu.actor.style = 'min-width: 660px; width: 660px;';
    indicator.mainMenuContainer = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        activate: false,
    });
    indicator.menuBoxLayout = new St.BoxLayout({
        vertical: true,
        style: 'spacing: 5px; padding: 10px;',
    });
    indicator.mainMenuContainer.add_child(indicator.menuBoxLayout);
    indicator.menu.addMenuItem(indicator.mainMenuContainer);
}

export function buildHeader(indicator) {

    const headerContainer = new St.BoxLayout({
        y_align: Clutter.ActorAlign.CENTER,
        x_expand: true,
    });


    const iconFile = indicator._extension.dir.get_child('assets').get_child('cs-logo.png');
    const headerIcon = new St.Widget({
        style_class: 'cs_logo_icon',
        style: `background-image: url("${iconFile.get_path()}"); width: 76px; height: 44px; margin-bottom: 5px;`,
        y_align: Clutter.ActorAlign.CENTER
    });

    const titleBox = new St.BoxLayout({
        vertical: true,
        y_align: Clutter.ActorAlign.CENTER,
        x_expand: true,
    });

    indicator.menuTitleLabel = new St.Label({
        text: 'CS2 Match Viewer',
        style_class: 'menu_title_text',
    });

    indicator.menuSubtitleLabel = new St.Label({
        text: 'Gnome shell extension that uses the bo3.gg api to fetch CS2 pro matches.',
        style_class: 'menu_subtitle_text',
    });

    titleBox.add_child(indicator.menuTitleLabel);
    titleBox.add_child(indicator.menuSubtitleLabel);

    indicator.settingsButton = new St.Button({
        reactive: true,
        can_focus: true,
        y_align: Clutter.ActorAlign.START,
        x_align: Clutter.ActorAlign.END,
        style_class: 'settings_button',
    });

    const settingsIcon = new St.Icon({
        icon_name: 'emblem-system-symbolic',
        style_class: 'system-status-icon',
        style: 'icon-size: 20px;'
    });

    indicator.settingsButton.set_child(settingsIcon);

    headerContainer.add_child(headerIcon);
    headerContainer.add_child(titleBox);
    headerContainer.add_child(indicator.settingsButton);

    const divisor1 = new St.Widget({
        style: 'background-color: rgba(255, 255, 255, 0.15); height: 1px; margin: 5px 0;'
    });

    const divisor2 = new St.Widget({
        style: 'background-color: rgba(255, 255, 255, 0.15); height: 0.5px; margin: 0 60px;',
        x_expand: true,
    });

    const tabsContainer = new St.BoxLayout({
        style_class: 'tabs_container',
        style: 'spacing: 10px;'
    });

    indicator.liveTabButton = new St.Button({
        label: 'Live matches',
        reactive: true,
        can_focus: true,
        x_expand: true,
        style_class: 'tab_button tab_button_active',
    });

    indicator.finishedTabButton = new St.Button({
        label: 'Finished matches',
        reactive: true,
        can_focus: true,
        x_expand: true,
        style_class: 'tab_button',
    });

    tabsContainer.add_child(indicator.liveTabButton);
    tabsContainer.add_child(indicator.finishedTabButton);

    indicator.mainPage.add_child(headerContainer);
    indicator.mainPage.add_child(divisor1);
    indicator.mainPage.add_child(tabsContainer);
    indicator.mainPage.add_child(divisor2)


    const matchTitleContainer = new St.BoxLayout({
        style: 'padding: 5px 10px; margin-top: 5px;',
    });
    const teamTitle = new St.Label({
        text: 'Teams',
        style_class: 'team_title',
        style: 'width: 400px; font-weight: bold; color: #888;',
    });
    const eventTitle = new St.Label({
        text: 'Event',
        style_class: 'event_title',
        style: 'width: 60px; font-weight: bold; color: #888;',
        x_align: Clutter.ActorAlign.CENTER,
    });
    const formatTitle = new St.Label({
        text: 'Format / Tier',
        style_class: 'format_title',
        style: 'font-weight: bold; color: #888;',
        x_expand: true,
        x_align: Clutter.ActorAlign.END,
    });

    matchTitleContainer.add_child(teamTitle);
    matchTitleContainer.add_child(eventTitle);
    matchTitleContainer.add_child(formatTitle);
    indicator.mainPage.add_child(matchTitleContainer);
}

export function buildMainSpinner(indicator) {
    indicator.mainSpinnerContainer = new St.BoxLayout({
        x_align: Clutter.ActorAlign.END,
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
        style: 'margin-top: 10px; padding: 6px; background-color: rgba(217, 133, 24, 0.15); border: 1px solid rgba(217, 133, 24, 0.4); border-radius: 6px;',
    });

    const mainSpinnerIcon = new St.Icon({
        icon_name: 'view-refresh-symbolic',
        style_class: 'system-status-icon',
        style: 'icon-size: 14px; margin-right: 6px;',
        y_align: Clutter.ActorAlign.CENTER,
    });

    const mainSpinnerLabel = new St.Label({
        text: 'Loading details...',
        style: 'color: #d98518; font-size: 11px; font-weight: bold;',
        y_align: Clutter.ActorAlign.CENTER,
    });

    indicator.mainSpinnerContainer.add_child(mainSpinnerIcon);
    indicator.mainSpinnerContainer.add_child(mainSpinnerLabel);
}


export function buildDetailsSection(indicator) {
    indicator.backButtonLabelContainer = new St.BoxLayout({ x_expand: true })

    indicator.backButton = new St.Button({
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

    indicator.backButton.set_child(backButtonIcon)

    indicator.detailContentLabel = new St.Label({
        text: 'Match Details:',
        style_class: 'detail_content_label',
        y_align: Clutter.ActorAlign.CENTER,
    });

    const divisor = new St.Widget({
        style: 'background-color: rgba(255, 255, 255, 0.15); height: 1px; margin: 10px 0;'
    });

    indicator.tournamentLogoLabelContainer = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: 'tournament_logo_label',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.tournamentLogo = new St.Widget({
        style_class: 'tournament_logo',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.tournamentNameDetail = new St.Label({
        text: '',
        style_class: 'tournament_name_detail',
    });

    indicator.matchDateDetail = new St.Label({
        text: '',
        style_class: 'match_date_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.teamsLogosDetailContainer = new St.BoxLayout({
        x_expand: true,
    });

    indicator.team1ContainerDetail = new St.BoxLayout({
        vertical: true,
        x_expand: true,
    });

    indicator.team1IconDetail = new St.Widget({
        style_class: 'team_logo_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team1NameContainer = new St.BoxLayout({
        style_class: 'team_name_container',
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team1FlagIconDetail = new St.Widget({
        style_class: 'team_flag_detail',
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
    });

    indicator.team1NameDetail = new St.Label({
        text: 'Unknown team',
        style_class: 'team_name_detail',
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team1NameContainer.add_child(indicator.team1FlagIconDetail);
    indicator.team1NameContainer.add_child(indicator.team1NameDetail);

    indicator.team1RankDetail = new St.Label({
        text: '',
        style_class: 'team_rank_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team1ScoreDetail = new St.Label({
        text: '-',
        style_class: `team_score_detail ${indicator.team1DetailClass}`,
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team2ContainerDetail = new St.BoxLayout({
        vertical: true,
        x_expand: true,
    })

    indicator.team2IconDetail = new St.Widget({
        style_class: 'team_logo_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team2NameContainer = new St.BoxLayout({
        style_class: 'team_name_container',
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team2FlagIconDetail = new St.Widget({
        style_class: 'team_flag_detail',
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
    });

    indicator.team2NameDetail = new St.Label({
        text: 'Unknown team',
        style_class: 'team_name_detail',
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team2NameContainer.add_child(indicator.team2NameDetail);
    indicator.team2NameContainer.add_child(indicator.team2FlagIconDetail);


    indicator.team2RankDetail = new St.Label({
        text: '',
        style_class: 'team_rank_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team2ScoreDetail = new St.Label({
        text: '-',
        style_class: 'team_score_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.mainPlayersContainer = new St.BoxLayout({
        vertical: true,
        style_class: 'main_players_container',
    });

    indicator.playersContainerTitleDetail = new St.Label({
        text: 'Rosters: ',
        style_class: 'players_container_title',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.rosterContainer = new St.BoxLayout({
        style_class: 'roster_container',
        x_expand: true,
    });

    indicator.team1PlayersContainer = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        x_align: Clutter.ActorAlign.START,
    });

    indicator.team2PlayersContainer = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        x_align: Clutter.ActorAlign.END,
    });

    function createPlayerSlot(isTeam2 = false) {
        const row = new St.BoxLayout({
            style_class: 'player_row',
            y_align: Clutter.ActorAlign.CENTER,
            x_align: isTeam2 ? Clutter.ActorAlign.END : Clutter.ActorAlign.START,
        });

        const flag = new St.Widget({
            style_class: isTeam2 ? 'player_flag_icon player_flag_icon_right' : 'player_flag_icon player_flag_icon_left',
            y_align: Clutter.ActorAlign.CENTER,
        });

        const name = new St.Label({
            text: '',
            style_class: 'player_name_detail',
            y_align: Clutter.ActorAlign.CENTER,
        });

        const rating = new St.Label({
            text: '',
            style_class: 'player_rating_detail',
            y_align: Clutter.ActorAlign.CENTER,
        });

        if (!isTeam2) {
            row.add_child(flag);
            row.add_child(name);
            row.add_child(rating);
        } else {
            row.add_child(rating);
            row.add_child(name);
            row.add_child(flag);
        }

        return { row, flag, name, rating };
    }

    indicator.team1PlayerSlots = [];
    indicator.team2PlayerSlots = [];

    for (let i = 0; i < 5; i++) {
        const slot1 = createPlayerSlot(false);
        indicator.team1PlayerSlots.push(slot1);
        indicator.team1PlayersContainer.add_child(slot1.row);

        const slot2 = createPlayerSlot(true);
        indicator.team2PlayerSlots.push(slot2);
        indicator.team2PlayersContainer.add_child(slot2.row);
    }

    indicator.ratingsSubtitle = new St.Label({
        text: 'Approximate ratings from last 6 months',
        style_class: 'ratings_subtitle',
    });

    indicator.mapsContainer = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: 'maps_container',
    });

    const spacer1 = new St.Widget({
        x_expand: true,
    });

    const spacer2 = new St.Widget({
        x_expand: true,
        style: 'min-width: 60px;',
    });

    indicator.rosterContainer.add_child(indicator.team1PlayersContainer);
    indicator.rosterContainer.add_child(spacer2)
    indicator.rosterContainer.add_child(indicator.team2PlayersContainer);

    indicator.mainPlayersContainer.add_child(indicator.playersContainerTitleDetail);
    indicator.mainPlayersContainer.add_child(indicator.rosterContainer);
    indicator.mainPlayersContainer.add_child(indicator.ratingsSubtitle);

    indicator.team1ContainerDetail.add_child(indicator.team1IconDetail);
    indicator.team1ContainerDetail.add_child(indicator.team1NameContainer);
    indicator.team1ContainerDetail.add_child(indicator.team1RankDetail);
    indicator.team1ContainerDetail.add_child(indicator.team1ScoreDetail);
    indicator.team2ContainerDetail.add_child(indicator.team2IconDetail);
    indicator.team2ContainerDetail.add_child(indicator.team2NameContainer);
    indicator.team2ContainerDetail.add_child(indicator.team2RankDetail);
    indicator.team2ContainerDetail.add_child(indicator.team2ScoreDetail);

    indicator.teamsLogosDetailContainer.add_child(indicator.team1ContainerDetail);
    indicator.teamsLogosDetailContainer.add_child(spacer1);
    indicator.teamsLogosDetailContainer.add_child(indicator.team2ContainerDetail);


    indicator.backButtonLabelContainer.add_child(indicator.backButton);
    indicator.backButtonLabelContainer.add_child(indicator.detailContentLabel);

    indicator.tournamentLogoLabelContainer.add_child(indicator.tournamentLogo);
    indicator.tournamentLogoLabelContainer.add_child(indicator.tournamentNameDetail);
    indicator.tournamentLogoLabelContainer.add_child(indicator.matchDateDetail);

    indicator.detailsPage.add_child(indicator.backButtonLabelContainer);
    indicator.detailsPage.add_child(divisor);
    indicator.detailsPage.add_child(indicator.tournamentLogoLabelContainer);
    indicator.detailsPage.add_child(indicator.teamsLogosDetailContainer);
    indicator.detailsPage.add_child(indicator.mainPlayersContainer);
    indicator.detailsPage.add_child(indicator.mapsContainer);
}
