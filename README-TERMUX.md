# Run Personal Cloud on Android Phone

This guide shows how to run the Personal Cloud backend on an Android phone using Termux.

## What you need

- Android phone
- Termux installed from F-Droid or a trusted source
- Internet access for installing Node.js and packages
- Optional: Tailscale for private remote access

## Setup Steps

1. Open Termux on your phone.
2. Update packages:

   ```bash
   pkg update && pkg upgrade
   ```

3. Install Node.js and Git:

   ```bash
   pkg install nodejs git
   ```

4. Move into your project folder or clone the repository:

   ```bash
   git clone <your-repo-url>
   cd PersonalCloud/backend
   ```

5. Create the environment file:

   ```bash
   cp .env.example .env
   ```

6. Keep these values in `.env` for phone deployment:

   ```env
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=production
   CORS_ORIGIN=*
   ```

7. Install backend dependencies:

   ```bash
   npm install
   ```

8. Start the server:

   ```bash
   npm start
   ```

9. Open the app on the phone browser:

   ```text
   http://127.0.0.1:3000
   ```

## Access from another device

If you want to open the server from a laptop or another phone:

- Use the phone's Wi-Fi/LAN IP address with port `3000`.
- Or use Tailscale and open the phone's Tailscale IP or MagicDNS name.

## Tailscale Setup

1. Install Tailscale on the Android phone.
2. Sign in to the same Tailscale network on both devices.
3. Keep the backend host set to `0.0.0.0`.
4. Start the server in Termux.
5. Use the Tailscale IP or MagicDNS hostname from the remote device.

## Troubleshooting

- If `npm start` fails, run `npm install` again.
- If the browser cannot connect, confirm the backend is still running in Termux.
- If a remote device cannot connect, check Wi-Fi, Tailscale login, and the phone IP address.
- If uploads or logs fail, make sure the `uploads/` and `logs/` folders exist in the backend folder.

## Quick Command List

```bash
pkg update && pkg upgrade
pkg install nodejs git
cd PersonalCloud/backend
cp .env.example .env
npm install
npm start
```