#!/data/data/com.termux/files/usr/bin/bash

termux-wake-lock

# Start SSH server
sshd

# Start Python HTTP server
cd /storage/emulated/0/SyncedFolder
python -m http.server 8080