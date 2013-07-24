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

function init() {
}

function enable() {
    let volumeMenu = Main.panel.statusArea.volume;
    volumeMenu._frontPanelSwitch = new PopupMenu.PopupSwitchMenuItem("Front Panel", _isFrontPanelOn());
    volumeMenu._frontPanelSwitch.connect('toggled', _toggleFrontPanel);
    volumeMenu.menu.addMenuItem(volumeMenu._frontPanelSwitch, 1);
}

function disable() {
    let volumeMenu = Main.panel.statusArea.volume;
    volumeMenu._frontPanelSwitch.destroy();
}

// returns true if the front panel is on; otherwise false
function _isFrontPanelOn() {
    let frontPanelStatusString = GLib.spawn_command_line_sync("amixer -c 0 get 'Front Panel'");
    let frontPanelStatus = /Playback \[(on|off)\]/.exec(frontPanelStatusString)[1];
    return frontPanelStatus === 'on';
}

// toggles front panel output using alsa
function _toggleFrontPanel() {
    GLib.spawn_command_line_sync("amixer -q -c 0 set 'Front Panel' toggle");
}
