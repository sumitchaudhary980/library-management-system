# 📚 Library Management System

A modern full-stack **Library Management System** built with **HTML, CSS, JavaScript, Node.js, Express.js, SQLite, and Cloudinary**.

The project provides a complete library administration panel for managing books, authors, genres, readers, borrowing records, and fines through a clean and responsive interface.

The application follows a separate **frontend** and **backend** architecture for better scalability and maintainability.

---

# 🚧 Project Status

**Status:** Under Active Development

The project is actively being developed. Core library management modules are functional, while additional features and improvements are continuously being added.

---

# ✨ Features

## Authentication

- Secure Admin Login
- Reader Login
- Session-based Authentication
- Protected Routes
- Password Hashing using bcrypt
- Forgot Password
- Password Reset via Email
- Secure One-Time Password Reset Links

---

## Dashboard

- Total Books
- Total Authors
- Total Genres
- Total Readers

---

## Book Management

- Add Books
- Edit Books
- Delete Books
- Upload Book Covers
- Cloudinary Image Storage
- Automatic Image Replacement
- Automatic Image Cleanup
- Search
- Pagination

---

## Author Management

- Add Authors
- Edit Authors
- Delete Authors
- Search
- Pagination

---

## Genre Management

- Add Genres
- Edit Genres
- Delete Genres
- Search
- Pagination

---

## Reader Management

- Add Readers
- Edit Readers
- Activate Reader
- Deactivate Reader
- Search
- Filtering
- Pagination

---

## Borrow Management

- Borrow Books
- Return Books
- Due Date Tracking
- Renewal Support

---

## Fine Management

- Automatic Fine Calculation
- Fine Payment Tracking
- Penalty Management

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- Bootstrap 5

## Backend

- Node.js
- Express.js
- Nodemailer

## Database

- SQLite
- Better SQLite3

## Image Storage

- Cloudinary

## Security

- Password hashing

- Session authentication

- Protected routes

- Helmet security headers

- Upstash Rate Limiter

- Server-side validation

- Client-side validation

---

# ☁️ Cloudinary

Book cover images are stored on Cloudinary.

Features include:

- Upload images
- Replace existing images
- Delete old images automatically
- Optimized image delivery

---

# 🔒 Security

- Password hashing
- Session authentication
- Protected routes
- Helmet security headers
- Upstash Rate Limiter
- Server-side validation
- Client-side validation

---

# 📂 Project Structure

```text
Library-Management-System
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── seeders
│   │   ├── cron
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend
│   ├── admin
│   ├── user
│   ├── assets
│   └── index.html
│
├── LICENSE
├── README.md
└── .gitignore
```

---

# ⚙️ Project Setup

## 1. Clone the repository

```bash
git clone https://github.com/sumitchaudhary980/Library-Management-System.git
```

```bash
cd Library-Management-System
```

---

## 2. Install Backend Dependencies

```bash
cd backend
```

```bash
npm install
```

---

## 3. Create Environment File

Create a **.env** file inside the **backend** folder.

```env
# Application
PORT=3000
APP_URL=http://localhost:3000
SESSION_SECRET=your_session_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="Kaiser Library <your_email@gmail.com>"

# Upstash Rate Limiter
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

---

## 4. Configure Database

Open:

```
backend/src/config/initDB.js
```

Comment out the database creation functions and seeders after the database has been created for the first time.

Example:

```javascript
// createUserTable();
// createAuthorTable();
// createGenreTable();
// createBookTable();
// createBorrowedBookTable();

// seedAdmin();
// seedAuthors();
// seedGenres();
// seedBooks();
```

These should only be run when initializing a fresh database.

---

## 5. Start the Server

```bash
npm start
```

or

```bash
npm run dev
```

---

The application is now ready to use.

---

# 🚀 Upcoming Features

- Reader Registration
- Reader Profile
- Borrow History
- Book Reservations
- Dashboard Analytics
- Reports
- Email Notifications
- QR / Barcode Support
- Activity Logs
- Role Based Access Control
- Advanced Search
- Export Reports

---

# 📄 License

This project is licensed under the **MIT License**.

Copyright © 2026 **Sumit Kumar Chaudhary**

---

# 👨‍💻 Developed By

**Sumit Kumar Chaudhary**

GitHub:
https://github.com/sumitchaudhary980

Email:
jaiswalsumit1010@gmail.com

---

## Built With

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Node.js
- Express.js
- SQLite
- Better SQLite3
- Cloudinary
- Multer
- bcrypt
- express-session
- Helmet
- Upstash Rate Limiter
