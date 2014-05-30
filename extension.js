 /* A simple daemon manager for Gnome-Shell
  * Copyright 2013-2014 Javier Garson Aparicio < lanstat AT gmail DOT com >
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  * 
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU General Public License for more details.
  * 
  * You should have received a copy of the GNU General Public License
  * along with this program.  If not, see <http://www.gnu.org/licenses/>.
  */

const St = imports.gi.St;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const EXTENSIONDIR = Me.dir.get_path();

const Main = imports.ui.main;
const Panel = Main.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const RunDialog = imports.ui.runDialog;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const DAEMONS_DAEMON_KEY = 'daemon';

let daemonManager;


const DaemonManagerStatusIcon = new Lang.Class({
	Name: 'DaemonManagerStatusIcon',
	Extends: PanelMenu.Button,
	
	_init: function () {
		this.parent(0.0);
		
		this._icon = new St.Icon({ icon_name: 'system-run-symbolic', style_class: 'system-status-icon' }); 
        this.actor.add_actor(this._icon);
        this.actor.add_style_class_name('panel-status-button');
		
        this.initMenu();	
	},
	
	initMenu: function() {
		let daemons = this.daemon;
        for(let i = 0; i < daemons.length; ++i) {
			this.daemonToggle = new PopupMenu.PopupSwitchMenuItem(daemons[i]);
		    this.daemonToggle.connect('toggled', Lang.bind(this, function(item) {
		    	this.onDaemonToggled(item);
		    }));
		    this.menu.addMenuItem(this.daemonToggle);
        }
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        item = new PopupMenu.PopupMenuItem("Reload Daemons");
		item.connect('activate', Lang.bind(this, this.onReloadActivate));
		this.menu.addMenuItem(item);	
		
		item = new PopupMenu.PopupMenuItem("Settings");
		item.connect('activate', Lang.bind(this, this.onPreferencesActivate));
		this.menu.addMenuItem(item);
		
		Util.spawn([EXTENSIONDIR+"/daemonsmanager.sh"]);
	},
	
	onReloadActivate : function(){
		this.menu.removeAll();
		
		this.initMenu();
	},
	
	onPreferencesActivate : function(){
		Util.spawn([EXTENSIONDIR+"/daemonsmanager.sh"]);
		Util.spawn(["gnome-shell-extension-prefs","daemon.manager@lanstat.gmail.com"]);
		return 0;
	},
	
	onDaemonToggled : function(item){
		let message;
		let daemon = item.label.text;
		let passwd = this.password;
		if (item.state){
			Util.spawn([EXTENSIONDIR+"/daemonsmanager.sh", "start", daemon, passwd]);
			message = 'started';
		}else{
			Util.spawn([EXTENSIONDIR+"/daemonsmanager.sh", "stop", daemon, passwd]);
        	message = 'stopped';
		}
		this.showMessage(daemon+' '+message);
	},
	
	showMessage : function(daemon) {
		let label = new St.Label({ style_class: 'daemon-label', text: daemon });
	    let monitor = Main.layoutManager.primaryMonitor;
	    global.stage.add_actor(label);
	    label.set_position(Math.floor (monitor.width / 2 - label.width / 2), Math.floor(monitor.height / 2 - label.height / 2));
	    Mainloop.timeout_add(3000, function () { label.destroy(); });
	},
	
	loadConfig : function(){
		this.Settings = Convenience.getSettings();
	},
	
	get daemon(){
		if(!this.Settings)
			this.loadConfig();
		let daemons = this.Settings.get_value(DAEMONS_DAEMON_KEY);
		daemons = daemons.deep_unpack();
		return daemons;
	},
	
	get password(){
		if(!this.Settings)
			this.loadConfig();
		return  this.Settings.get_string('passwd');
	},
});

const DaemonManager = new Lang.Class({
	Name: 'DaemonManager',
	
	_init : function () {
	},
	
	enable: function() {
		this._status_icon = new DaemonManagerStatusIcon();
		Panel.addToStatusArea('daemonmanager', this._status_icon, 0);
	},
	
	disable: function () {
		this._status_icon.destroy();
	},
});

function init() {
    daemonManager = new DaemonManager();
    return daemonManager;
}

