#!/bin/bash

# A simple daemon manager for Gnome-Shell
# Copyright 2013-2014 Javier Garson Aparicio < lanstat AT gmail DOT com >
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
 
MANAGER_START='systemctl_start'
MANAGER_STOP='systemctl_stop'
MANAGER_LIST='systemctl_list'

systemctl_start ()
{
	echo $2 | sudo -S systemctl start $1
}

systemctl_stop ()
{
	echo $2 | sudo -S systemctl stop $1
}

systemctl_list ()
{
	systemctl list-unit-files | grep .service | awk '{print $1;}' >> /tmp/daemons.avalaible
}

service_start () 
{
	echo '2'
}

service_stop ()
{
	echo '3'
}

service_list ()
{
	echo '1'
}

if hash 'service' 2>/dev/null; then
	MANAGER_START='service_start'
	MANAGER_STOP='service_stop'
	MANAGER_LIST='service_list'
fi 

echo $3 >> /tmp/aux

case $1 in
"start")
$MANAGER_START $2 $3
;;
"stop")
$MANAGER_STOP $2 $3
;;
*)
$MANAGER_LIST
;;
esac
