📱 Android Personal Cloud Storage Server

Transform an old Android phone into a secure Personal Cloud Storage Server using Tailscale, Syncthing, and Termux. This project provides automatic file synchronization, encrypted remote access, and browser-based file sharing without relying on third-party cloud providers.


✨ Features

* 🔒 End-to-end encrypted private network using WireGuard (Tailscale)
* 📂 Peer-to-peer file synchronization with Syncthing
* ☁️ No Google Drive, Dropbox, or other cloud services required
* 🌍 Access files securely from anywhere
* 📱 Cross-platform support (Android, Windows, macOS, Linux)
* 🌐 Optional browser-based file server
* 💾 Reuse an old Android phone as a dedicated storage node
* ⚡ Low power consumption and easy to maintain


🛠️ Tech Stack

Technology	Purpose
Tailscale	Private VPN network
WireGuard	End-to-end encryption
Syncthing	Peer-to-peer file synchronization
Termux	Linux environment on Android
Python	Lightweight HTTP file server
OpenSSH	Secure remote shell (optional)

📡 Protocols Used

Protocol	Purpose
WireGuard	Secure VPN communication
TLS	Encrypted Syncthing transfers
TCP/IP	Network communication
HTTP	Browser-based file access
SSH	Remote terminal access
mDNS / Global Discovery	Device discovery


📋 Requirements

Device	Required Apps
Old Android Phone	Termux, Tailscale, Syncthing
Primary Android Phone	Tailscale, Syncthing
Laptop / PC	Tailscale, Syncthing


🚀 Installation

1️⃣ Install Tailscale

Install Tailscale on all devices and sign in using the same account.

Each device automatically receives a private 100.x.x.x IP address.

No port forwarding or router configuration is required.


2️⃣ Configure the Storage Phone

Inside Termux, run:

pkg update && pkg upgrade
pkg install python openssh
termux-setup-storage

Grant storage permission when prompted.

Disable battery optimization for:

* Termux
* Syncthing
* Tailscale


3️⃣ Configure Syncthing

Install Syncthing on every device.

Pair Devices

* Copy each device’s Device ID
* Add all devices as trusted peers

Share Folder

Share folders from:

* Laptop ➜ Old Phone
* Primary Phone ➜ Old Phone

Configure the folder on the old phone as:

Receive Only

This prevents accidental deletion of backup files.


4️⃣ Start HTTP File Server (Optional)

cd /storage/emulated/0/SyncedFolder
python -m http.server 8080

Open from any Tailnet device:

http://<Old-Phone-Tailscale-IP>:8080

Example:

http://100.96.54.12:8080


5️⃣ Keep Services Running

Prevent Android from stopping background processes:

termux-wake-lock

Recommended:

* Install Termux:Boot
* Keep the storage phone charging
* Connect to Wi-Fi


🔐 Security

* WireGuard encrypted VPN
* TLS encrypted synchronization
* No public IP exposure
* No port forwarding
* Peer-to-peer communication
* Zero third-party cloud dependency



📁 Project Structure

Android-Personal-Cloud/
│
├── README.md
├── docs/
│   ├── architecture.png
│   ├── setup-guide.pdf
│   └── screenshots/
│
├── scripts/
│   ├── start_server.sh
│   └── auto_start.sh
│
└── LICENSE



🌟 Advantages

* Free personal cloud
* Automatic backups
* Remote access
* Cross-platform
* Secure communication
* Reuses old hardware
* Easy to scale
* Lightweight solution


⚠️ Limitations

* Storage phone should remain powered on
* Sync speed depends on internet connection
* Limited by phone storage capacity
* Background services may require battery optimization to be disabled

📚 Use Cases

* Personal Cloud Storage
* Photo Backup
* Laptop File Backup
* Home NAS Alternative
* Secure File Sharing
* Student Project
* Offline Backup Server


🔮 Future Improvements

* Docker deployment
* Web dashboard
* File versioning
* Automatic health monitoring
* Scheduled backups
* Multi-user authentication
* File compression
* Notifications


🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request


📄 License

This project is licensed under the MIT License.


👨‍💻 Author

Karthik Reddy

If you found this project useful, consider giving it a ⭐ on GitHub!
