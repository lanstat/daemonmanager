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

const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const GtkBuilder = Gtk.Builder;
const Gio = imports.gi.Gio;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const EXTENSIONDIR = Me.dir.get_path();

const DAEMONS_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.daemon-manager';
const DAEMONS_DAEMON_KEY = 'daemon';
const DAEMONS_ACTUAL_AVALAIBLE = 'actual-avalaible';
const DAEMONS_ACTUAL_ENABLE = 'actual-enable';

function init() {
    Convenience.initTranslations();
}

const DaemonManagerPrefsWidget = new GObject.Class({
    Name: 'DaemonManager.Prefs.Widget',
    GTypeName: 'DaemonManagerPrefsWidget',
    Extends: Gtk.Box,
    
    Window : new Gtk.Builder(),
    Avalaible : new Array(),

    _init: function(params) {
    	this.parent(params);
    	this.initWindow();
    	this.add(this.MainWidget);
    },
    
    initWindow: function(){
    	let that = this;
    	this.Window.add_from_file(EXTENSIONDIR+"/daemon-settings.ui");
    	this.MainWidget = this.Window.get_object("main-widget");
    	
    	this.Window.get_object("add-button").connect("clicked",function(){
    		that.addDaemon();
    	});
    	this.Window.get_object("remove-button").connect("clicked",function(){
    		that.removeDaemon();
    	});
    	
    	this.loadAvalaibleDaemons();
    	this.loadEnableDaemons();
    	this.Window.get_object("user-password").set_text(this.password);
    	
    	this.Window.get_object("treeview-selection1").connect("changed",function(selection){
    		that.selectionChanged(selection);
    	});
    	
    	this.Window.get_object("update-button").connect("clicked",function(){
    		that.updatePassword();
    	});
    },
    
    loadConfig : function(){
    	let that = this;
		this.Settings = Convenience.getSettings();	
   		this.Settings.connect("changed", function(){ 
   			that.refreshUI();
   		});
	},
	
	refreshUI: function() {
    	this.MainWidget = this.Window.get_object("main-widget");
    	this.enabTreeview = this.Window.get_object("enable-treeview");
    	this.enabListstore = this.Window.get_object("liststore2");
    	this.passwordEntry = this.Window.get_object("user-password");
    	
    	this.enabListstore.clear();
    	
    	let current = this.enabListstore.get_iter_first();
    	
    	let enabled = this.daemon;
    	for(let i = 0; i < enabled.length; ++i) {
			current = this.enabListstore.append();
			this.enabListstore.set_value(current, 0, enabled[i]);
		}
    	
    	this.passwordEntry.set_text(this.password);
	},
    
    loadAvalaibleDaemons: function(){
    	this.avalTreeview = this.Window.get_object("avalaible-treeview");
    	this.avalListstore = this.Window.get_object("liststore1");
    	
    	this.avalTreeview.set_model(this.avalListstore);
    	
    	let column = new Gtk.TreeViewColumn();
    	this.avalTreeview.append_column(column);
    	
    	let renderer = new Gtk.CellRendererText();
    	column.pack_start(renderer,null);
    	column.set_cell_data_func(renderer,function(){
    		arguments[1].markup = arguments[2].get_value(arguments[3],0);
    	});
    	
    	let current = this.avalListstore.get_iter_first();
    	
    	let flines = GLib.file_get_contents('/tmp/daemons.avalaible');
		let nlines = ("" + flines[1]).split("\n");
		for(let i = 0; i < nlines.length - 1 ; ++i) {
			let line =  nlines[i].trim();
			
			this.Avalaible.push(line);
			current = this.avalListstore.append();
			this.avalListstore.set_value(current, 0, line);
		}
    },
    
    loadEnableDaemons: function(){
    	this.enabTreeview = this.Window.get_object("enable-treeview");
    	this.enabListstore = this.Window.get_object("liststore2");
    	
    	this.enabTreeview.set_model(this.enabListstore);
    	
    	let column = new Gtk.TreeViewColumn();
    	this.enabTreeview.append_column(column);
    	
    	let renderer = new Gtk.CellRendererText();
    	column.pack_start(renderer,null);
    	column.set_cell_data_func(renderer,function(){
    		arguments[1].markup = arguments[2].get_value(arguments[3],0);
    	});
    	
    	this.enabListstore.clear();
    	
    	let current = this.enabListstore.get_iter_first();
    	
    	let enabled = this.daemon;
    	for(let i = 0; i < enabled.length; ++i) {
			current = this.enabListstore.append();
			this.enabListstore.set_value(current, 0, enabled[i]);
		}
	},
	
	addDaemon: function() {
		let selected = this.actualAvalaible;
		let enabled = this.daemon;
		enabled.push(this.Avalaible[selected]);
		this.daemon = enabled;
	},
	
	removeDaemon: function() {
		let enabled = this.daemon;
		enabled.pop();
		this.daemon = enabled;
	},
	
	selectionChanged : function(select){
		let a = select.get_selected_rows(this.avalListstore)[0][0];

		if(typeof a != "undefined"){
			if(this.actualAvalaible != parseInt(a.to_string())){
				this.actualAvalaible = parseInt(a.to_string());
			}
		}
	},
	
	updatePassword : function() {
		let entry = this.Window.get_object("user-password").get_text();
		this.password = entry;
	},
	
	get password(){
		if(!this.Settings)
			this.loadConfig();
		return  this.Settings.get_string('passwd');
	},
	
	set password(v){
		if(!this.Settings)
			this.loadConfig();
		this.Settings.set_string('passwd', v);
	},
    
	get daemon(){
		if(!this.Settings)
			this.loadConfig();
		let daemons = this.Settings.get_value(DAEMONS_DAEMON_KEY);
		daemons = daemons.deep_unpack();
		return daemons;
	},

	set daemon(v){
		if(!this.Settings)
			this.loadConfig();
		this.Settings.set_value(DAEMONS_DAEMON_KEY,new GLib.Variant('as', v));
	},
	
	get actualAvalaible(){
		if(!this.Settings)
			this.loadConfig();
		let a = this.Settings.get_int(DAEMONS_ACTUAL_AVALAIBLE);

		let l = this.Avalaible.length-1;
		if(a < 0)
			a = 0;
		if(l < 0)
			l = 0;
		if(a > l)
			a = l;

		return a;
	},
	
	set actualAvalaible(a){
		if(!this.Settings)
			this.loadConfig();

		let l = this.Avalaible.length-1;
		if(a < 0)
			a = 0;
		if(l < 0)
			l = 0;
		if(a > l)
			a = l;

		this.Settings.set_int(DAEMONS_ACTUAL_AVALAIBLE,a);
	},
	
	get actualEnable(){
		if(!this.Settings)
			this.loadConfig();
		let a = this.Settings.get_int(DAEMONS_ACTUAL_ENABLE);
		let daemons = this.daemon;

		let l = daemons.length-1;
		if(a < 0)
			a = 0;
		if(l < 0)
			l = 0;
		if(a > l)
			a = l;

		return a;
	},
	
	set actualEnable(a){
		if(!this.Settings)
			this.loadConfig();
		let daemons = this.daemon;

		let l = daemons.length-1;
		if(a < 0)
			a = 0;
		if(l < 0)
			l = 0;
		if(a > l)
			a = l;

		this.Settings.set_int(DAEMONS_ACTUAL_ENABLE,a);
	},
});

function buildPrefsWidget() {
    let widget = new DaemonManagerPrefsWidget();
    widget.show_all();

    return widget;
}
