# FileXpress — Real‑Time Secure File Transfer Application

A full‑stack file transfer app built with **React**, **Socket.IO**, and **Express**. Users can register, log in, and share small files in real time with end‑to‑end encryption and progress indicators. Deployed with CI/CD on GitHub + Render.

---

## ▶️ How to Use

To successfully send and receive a file:

1. **Sender**: Log in, select a file, and click the **Send** button.
2. **Receiver**: Open the app as another user (in a different browser or device), and **accept** the file transfer.
3. **Back to Sender**: Switch back to the **sender tab** — this is required to trigger the transfer process.
4. **Wait**: Once the sender sees **`Status: End`**, the transfer is complete.
5. **Receiver Download**: Switch to the **receiver tab** — the file will **automatically download**.

> ⚠️ Ensure both users are online during the transfer process.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Environment Variables](#environment-variables)
7. [Backend](#backend)

   * Server Setup
   * Authentication Routes
   * Socket.IO Logic
   * File Uploads (Optional)
8. [Frontend](#frontend)

   * React App & Components
   * `socketManager.js`
   * `crypto.js` Utilities
   * Dashboard Flow
9. [Encryption Flow](#encryption-flow)
10. [Testing Locally](#testing-locally)
11. [Deployment & CI/CD](#deployment--cicd)
12. [Usage](#usage)
13. [Contributing](#contributing)
14. [License](#license)

---

## 🔍 Project Overview

FileXpress is a lightweight, user‑friendly, real‑time file sharing platform. It demonstrates:

* **User Authentication** (registration & login)
* **Real‑time Transfers** using **Socket.IO**
* **Progress Indicators** and **Notifications**
* **AES Encryption** for file security
* **Responsive React UI**
* **CI/CD** pipeline with **GitHub Actions** and **Render** deployment

Ideal for sharing small files (up to 10 MB) between authenticated users without needing heavy backend storage.

---

## ⭐ Features

* **User Auth**: Secure JWT‑based registration & login
* **Real‑time Transfers**: Socket.IO streams files in chunks
* **Progress Bars**: Live feedback on upload/download progress
* **Notifications**: Transfer requests, accepts, rejections, errors
* **Encryption**: AES‑256 encryption/decryption via CryptoJS
* **Responsive UI**: Built with React and TailwindCSS (or plain CSS)
* **Deployment**: Automated deploys via GitHub Actions + Render

---

## 🛠 Tech Stack

| Layer      | Technology             |
| ---------- | ---------------------- |
| Frontend   | React, Vite, Tailwind  |
| Real‑time  | Socket.IO (websocket)  |
| Backend    | Node.js, Express       |
| Database   | MongoDB (Mongoose)     |
| Encryption | CryptoJS (AES)         |
| Deployment | GitHub Actions, Render |

---


---

## 🔧 Prerequisites

* **Node.js** (v18+)
* **npm** or **yarn**
* **MongoDB** instance (local or Atlas)
* **GitHub** account (for repo + Actions)
* **Render** (or other) account for deployment

---

## ⚙️ Installation

1. **Clone repo**:

   ```bash
   git clone https://github.com/aartthh/file-transfer-app.git
   cd file-transfer-app
   ```

2. **Configure environment** (see next section).

3. **Install dependencies**:

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. **Run locally**:

   ```bash
   # In one terminal
   cd server && npm start
   # In another
   cd client && npm run dev
   ```

---

## 🔐 Environment Variables

### Backend (`server/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/filetransfer
JWT_SECRET=your_jwt_secret
CLIENT_URLS=http://localhost:3000,http://localhost:5173
```

### Frontend (`client/.env`)

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_CRYPTO_SECRET=your_encryption_key
```

---

## 🖥️ Backend

### Server Setup (`server/index.js`)

* Express app with JSON parsing & CORS
* HTTP/HTTPS server creation
* Socket.IO initialization with CORS whitelist
* MongoDB connection via Mongoose

### Authentication Routes (`routes/auth.js`)

* `POST /auth/register`: username/password → hashed & saved → returns JWT
* `POST /auth/login`: validates credentials → returns JWT
* `GET /auth/me`: returns current user (protected)

### Real‑time File Transfer

* **Active users** tracked in `Map(socketId → username)`
* Events:

  * `initiate-transfer`: sender requests transfer
  * `file-chunk`: chunked data streaming
  * `transfer-accepted`/`rejected`/`progress`/`complete`

### (Optional) File Uploads

* Uses `multer` in `routes/fileRoutes.js`
* `POST /api/files/upload` → saves in `uploads/` → returns public URL

---

## ⚛️ Frontend

### React App Structure

* **SessionContext**: stores auth state & token
* **FileUploader** component (optional) for manual uploads
* **Dashboard.jsx**: main UI, lists active users, transfers, notifications

### `socketManager.js`

* Singleton manager wrapping `socket.io-client`
* `connect(username)`, `disconnect()`, auto-reconnect disabled if needed

### `crypto.js` (in `client/src/utils`)

* `encryptFile(arrayBuffer)`, `decryptFile(encryptedString)`
* Uses AES via CryptoJS and VITE\_CRYPTO\_SECRET

### Dashboard Flow

1. On mount: connect socket, load persisted transfers
2. On file select: preview file
3. On send: generate `transferId`, emit `initiate-transfer`
4. On accept: read file as `ArrayBuffer`, chunk → encrypt → emit `file-chunk`
5. On receive: decrypt → assemble → auto‑download via Blob & `a` tag
6. Notifications & progress bar updates throughout

---

## 🔒 Encryption Flow

1. **Sender**: `encryptFile(chunkBuffer)` before emitting each chunk
2. **Receiver**: `decryptFile(encryptedString)` on received data

Secret key stored in `VITE_CRYPTO_SECRET` and used by `crypto.js` utilities.

---

## 🧪 Testing Locally

1. Start backend and frontend
2. Register two users in different browser windows
3. Select a file (≤ 10 MB), choose recipient → send
4. Watch real‑time progress & auto‑download on recipient side

---

## 🚀 Deployment & CI/CD

### GitHub Actions

* `.github/workflows/deploy.yml` builds both `client` and `server` on push to `main`

### Render Setup

Click on this link - https://file-transfer-app-1.onrender.com/
* Environment variables set in Render dashboard

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/...`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/...`)
5. Open a Pull Request

---

## 📄 License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
