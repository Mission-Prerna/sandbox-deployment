#!/bin/sh

cd /usr/odk
/usr/local/bin/node lib/bin/backup.js >/proc/1/fd/1 2>/proc/1/fd/2

