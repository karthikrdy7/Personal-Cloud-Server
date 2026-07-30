Overview

Instead of letting an old phone gather dust, this setup repurposes it as a dedicated storage device on your personal network:

**New phone** & **laptop** act as sending devices.

**Old phone** acts as the storage/backup node.

**Tailscale** connects all devices into one private, encrypted network (a "tailnet") — accessible from anywhere, no public IP or router config needed.

**Syncthing** handles the actual file transfer/sync between devices, peer-to-peer, with no cloud middleman.

**Termux** provides a local Linux shell on the old phone, and can optionally run a lightweight Python HTTP server for quick browser-based access to synced files.

_Requirements_

| Device | Apps needed |
|---|---|
| **Old phone** (storage) | Termux (F-Droid), Tailscale, Syncthing |
| **New phone** (sender) | Tailscale, Syncthing |
| **Laptop** (sender) | Tailscale, Syncthing |


🚀 Setup
1. Connect all devices with Tailscale

Install Tailscale on all three devices and log in with the same account. Each device gets a stable private IP (100.x.x.x) and can reach the others directly, regardless of network/location.

2. Prepare the old phone
3. Inside Termux
pkg update && pkg upgrade

pkg install python openssh

termux-setup-storage   # grants access to shared Android storage


**Disable battery optimization for Termux, Tailscale, and Syncthing so they keep running in the background.
**

3. Set up Syncthing
   
Install Syncthing on all three devices.

On each device, copy its Device ID and add it as a peer on the others.

Share a folder from the new phone/laptop → set the old phone's folder type to "Receive Only" so it acts as a safe backup target
(accidental deletions elsewhere won't wipe the phone's copy).

Syncthing auto-discovers peers over the Tailscale network — no manual IP/port setup required.


5. Serve files over HTTP

If you want plain-browser access to files on the old phone (without opening Syncthing's UI):

cd /storage/emulated/0/SyncedFolder
Command:
**python -m http.server 8080**


Then, from any device on the tailnet: **http://<old-phone-tailscale-ip>:8080**

5. Keep it running
   
Use termux-wake-lock before starting long-running processes to prevent Android from killing them.

Use Termux:Boot to auto-start services on phone reboot.

Keep the phone charging if it's acting as an always-on node.

