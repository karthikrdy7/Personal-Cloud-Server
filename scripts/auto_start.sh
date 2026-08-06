#!/data/data/com.termux/files/usr/bin/bash

sleep 15

termux-wake-lock

cd /storage/emulated/0/SyncedFolder

python -m http.server 8080