import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export function buildPanelIndicator(indicator) {
    const container = new St.BoxLayout({});
    const icon = new St.Icon({
        icon_name: 'find-location-symbolic',
        style_class: 'system-status-icon',
    });
    indicator.textoStatus = new St.Label({
        text: 'Loading matches...',
        style_class: 'top_label',
        y_align: Clutter.ActorAlign.CENTER,
    });
    container.add_child(icon);
    container.add_child(indicator.textoStatus);
    indicator.add_child(container);
}

export function buildMenuBase(indicator) {
    indicator.menu.actor.style = 'width: 600px;';
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

    headerContainer.add_child(headerIcon);
    headerContainer.add_child(titleBox);

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
        text: 'Detailed view:',
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
    });

    indicator.tournamentLogo = new St.Widget({
        style_class: 'tournament_logo',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.tournamentNameDetail = new St.Label({
        text: '',
        style_class: 'tournament_name_detail',
    });

    indicator.testSlug = new St.Label({
        text: '',
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

    indicator.team1NameDetail = new St.Label({
        text: 'Unknown team',
        style_class: 'team_name_detail',
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

    indicator.team2NameDetail = new St.Label({
        text: 'Unknown team',
        style_class: 'team_name_detail',
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.team2ScoreDetail = new St.Label({
        text: '-',
        style_class: `team_score_detail ${indicator.team2ScoreDetail}`,
        x_align: Clutter.ActorAlign.CENTER,
    });

    indicator.mapsContainer = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: 'maps_container',
    });


    const spacer = new St.Widget({
        x_expand: true,
    });

    indicator.team1ContainerDetail.add_child(indicator.team1IconDetail);
    indicator.team1ContainerDetail.add_child(indicator.team1NameDetail);
    indicator.team1ContainerDetail.add_child(indicator.team1ScoreDetail);
    indicator.team2ContainerDetail.add_child(indicator.team2IconDetail);
    indicator.team2ContainerDetail.add_child(indicator.team2NameDetail);
    indicator.team2ContainerDetail.add_child(indicator.team2ScoreDetail);

    indicator.teamsLogosDetailContainer.add_child(indicator.team1ContainerDetail);
    indicator.teamsLogosDetailContainer.add_child(spacer);
    indicator.teamsLogosDetailContainer.add_child(indicator.team2ContainerDetail);


    indicator.backButtonLabelContainer.add_child(indicator.backButton);
    indicator.backButtonLabelContainer.add_child(indicator.detailContentLabel);

    indicator.tournamentLogoLabelContainer.add_child(indicator.tournamentLogo);
    indicator.tournamentLogoLabelContainer.add_child(indicator.tournamentNameDetail);
    indicator.tournamentLogoLabelContainer.add_child(indicator.testSlug);
    indicator.tournamentLogoLabelContainer.add_child(indicator.matchDateDetail);

    indicator.detailsPage.add_child(indicator.backButtonLabelContainer);
    indicator.detailsPage.add_child(divisor);
    indicator.detailsPage.add_child(indicator.tournamentLogoLabelContainer);
    indicator.detailsPage.add_child(indicator.teamsLogosDetailContainer);
    indicator.detailsPage.add_child(indicator.mapsContainer);
}
