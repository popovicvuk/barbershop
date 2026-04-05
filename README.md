# 🪒 Barber Shop Booking System

Modern, elegant, and responsive booking system for a premium barber shop. Built with Node.js, Express, and Vanilla JavaScript.

## ✨ Features

- **Elegant UI**: Premium dark-mode design with Playfair Display typography and glassmorphism.
- **Smart Calendar**: Real-time booking window (7 days) with automated cleanup of expired slots.
- **Dynamic Time Slots**: Automatically calculates workload based on the day of the week (Morning and Evening shifts).
- **Admin Dashboard**: Managed dashboard for barbers to:
  - View all bookings for a specific date.
  - Edit client names.
  - Cancel/Delete appointments.
  - **Block/Unblock Slots**: Mark specific times as unavailable manually.
- **Data Persistence**: Lightweight JSON database storage (`database.json`).

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/barber-shop.git
   cd barber-shop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and set your admin password:
   ```env
   ADMIN_PASSWORD=your_secret_password
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Storage**: JSON File System
- **Fonts**: Google Fonts (Playfair Display, Inter)

## 📁 Project Structure

- `server.js`: Node.js Express server and API logic.
- `index.html`: Client-side interface.
- `script.js`: Frontend booking logic and admin panel interactions.
- `style.css`: Custom design tokens and styles.
- `database.json`: Local storage for appointments (ignored by Git).

## 🔒 Security

- Admin dashboard is protected by a simple password check (configured via `.env`).
- API routes include basic validation to prevent overlapping bookings.

---
*Created for premium barbering experiences.*
