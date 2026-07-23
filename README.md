Overview
Instead of letting an old phone gather dust, this setup repurposes it as a dedicated storage device on your personal network:

**New phone** & **laptop** act as sending devices.
**Old phone** acts as the storage/backup node.
**Tailscale **connects all devices into one private, encrypted network (a "tailnet") — accessible from anywhere, no public IP or router config needed.
**Syncthing** handles the actual file transfer/sync between devices, peer-to-peer, with no cloud middleman.
**Termux** provides a local Linux shell on the old phone, and can optionally run a lightweight Python HTTP server for quick browser-based access to synced files.
