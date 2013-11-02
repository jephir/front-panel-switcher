// Front Panel Switcher - Toggle front panel audio output from the volume menu
//
// Written in 2013 by Jephir (www.jephir.name)
//
// To the extent possible under law, the author(s) have dedicated all
// copyright and related and neighboring rights to this software to the
// public domain worldwide. This software is distributed without any warranty.
//
// You should have received a copy of the CC0 Public Domain Dedication along
// with this software. If not, see
// <http://creativecommons.org/publicdomain/zero/1.0/>.

const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

let _frontPanelSwitchConnectedId;

const Gettext = imports.gettext.domain('front-panel-switcher');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
    Convenience.initTranslations("front-panel-switcher");
}

function enable() {
    let volumeMenu = Main.panel.statusArea.volume;
    let cardIndex = _getFrontPanelCard();
    let frontPanelExists = cardIndex !== -1;

    if (frontPanelExists) {
        let isFrontPanelOn = _isFrontPanelOn(cardIndex);

        // create front panel switch
        volumeMenu._frontPanelSwitch =
            new PopupMenu.PopupSwitchMenuItem(_("Front Panel"), isFrontPanelOn);

        // connect switch callback
        _frontPanelSwitchConnectedId =
            volumeMenu._frontPanelSwitch.connect(
                    'toggled',
                    _toggleFrontPanel.bind(this, cardIndex));

        // add switch to volume menu
        volumeMenu.menu.addMenuItem(volumeMenu._frontPanelSwitch, 1);

        // update switch status when volume menu opened
        volumeMenu.menu.connect('open-state-changed', function () {
          var isFrontPanelOn = _isFrontPanelOn(cardIndex);
          volumeMenu._frontPanelSwitch.setToggleState(isFrontPanelOn);
        });

    } else {

        // display "front panel not found" label
        volumeMenu._noFrontPanelItem =
            new PopupMenu.PopupMenuItem(_("No Front Panel"), { reactive: false });
        volumeMenu.menu.addMenuItem(volumeMenu._noFrontPanelItem, 1);
    }
}

function disable() {
    let volumeMenu = Main.panel.statusArea.volume;
    if (volumeMenu._frontPanelSwitch) {
        volumeMenu._frontPanelSwitch.disconnect(_frontPanelSwitchConnectedId);
        volumeMenu._frontPanelSwitch.destroy();
    }
    if (volumeMenu._noFrontPanelItem) {
        volumeMenu._noFrontPanelItem.destroy();
    }
}

// returns the card number of the first card that provides front panel controls
// if no card is found, returns -1
function _getFrontPanelCard() {
    let numCardsCommandOutput = GLib.spawn_command_line_sync("amixer info");
    let numCardsRegexOutput = /Simple ctrls\s*:\s*(\d+)/.exec(numCardsCommandOutput);
    let numCardsString = numCardsRegexOutput[1];
    let numCards = parseInt(numCardsString, 10);
    for (let i = 0; i < numCards; ++i) {
        let hasFrontPanelCommandOutput =
            GLib.spawn_command_line_sync("amixer -c " + i + " controls");
        let hasFrontPanel = /Front Panel/.test(hasFrontPanelCommandOutput);
        if (hasFrontPanel) {
            return i;
        }
    }
    return -1;
}

// returns true if the front panel is on; otherwise false
function _isFrontPanelOn(cardNum) {
    let frontPanelStatusCommandOutput
        = GLib.spawn_command_line_sync("amixer -c " + cardNum + " get 'Front Panel'");
    let frontPanelStatusRegexOutput = /Playback \[(on|off)\]/.exec(frontPanelStatusCommandOutput);
    let frontPanelStatusString = frontPanelStatusRegexOutput[1];
    return frontPanelStatusString === 'on';
}

// toggles front panel output using alsa
function _toggleFrontPanel(cardNum) {
    GLib.spawn_command_line_sync("amixer -q -c " + cardNum + " set 'Front Panel' toggle");
}
