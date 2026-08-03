# 📚 Library Management System

A modern full-stack **Library Management System** built with **HTML, CSS, JavaScript, Node.js, Express.js, SQLite, and Cloudinary**.

The project provides a complete library administration panel for managing books, authors, genres, readers, borrowing records, and fines through a clean and responsive interface.

The application follows a separate **frontend** and **backend** architecture for better scalability and maintainability.

---

# ✨ Features

## Authentication

- Secure Admin Login
- Reader Login
- Reader Registration with Auto-Generated Password Sent via Email
- Mandatory Password Change on First Login
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
- Reader Profile
- Activate Reader
- Deactivate Reader
- Search
- Filtering
- Pagination

---

## Borrow Management

- Borrow Books
- Return Books
- Book Reservations
- Due Date Tracking
- Renewal Support
- Borrow History

---

## Fine Management

- Automatic Fine Calculation
- Online Fine Payment via eSewa
- Server-side Payment Verification
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

## Payments

- eSewa Payment Gateway

## Security

- Password hashing
- Session authentication
- Protected routes
- Helmet security headers (CSP, form-action, etc.)
- Upstash Rate Limiter
- Server-side validation
- Client-side validation
- Signed and server-verified payment transactions

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

Create a **.env** file inside the **backend** folder with the following variables:

```env
# Application
PORT=3000
APP_URL=http://localhost:3000
SESSION_SECRET=your_session_secret
NODE_ENV=development

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
MAIL_FROM="Heritage Library <your_email@gmail.com>"

# Upstash Rate Limiter
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# eSewa Payment Gateway (RC / test environment)
ESEWA_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_CHECK_URL=https://rc.esewa.com.np/api/epay/transaction/status/
ESEWA_PRODUCT_CODE=your_esewa_product_code
ESEWA_SECRET_KEY=your_esewa_secret_key
```

> ⚠️ **Note:** The eSewa URLs above are for the **RC (test/sandbox) environment**. When deploying to production, replace them with eSewa's production endpoints and use your live merchant credentials.

---

## 4. Configure the Database

Open:

```
backend/src/config/initDB.js
```

On first run, the database tables and seed data (admin account, sample authors, genres, and books) will be created automatically.

After the database has been created once, comment out the creation and seeding functions to prevent them from running again on every server restart:

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

---

## 5. Start the Server

```bash
npm start
```

or, for development with auto-restart on file changes:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

## 6. Default Admin Login

After seeding, an admin account is created automatically. Check `backend/src/seeders` for the default admin credentials, and make sure to change the password after first login.

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

# ☁️ Cloudinary

Book cover images are stored on Cloudinary.

Features include:

- Upload images
- Replace existing images
- Delete old images automatically
- Optimized image delivery

---

# 💳 Payments

Fine payments are processed through **eSewa**.

- Each payment transaction is signed using HMAC-SHA256 before being sent to eSewa.
- After payment, the server independently verifies the transaction status with eSewa's status-check API before marking a fine as paid — the redirect from eSewa is never trusted on its own.
- Payment attempts are tracked in the database with `pending`, `paid`, and `failed` states.

---

# 🔒 Security

- Password hashing
- Session authentication
- Protected routes
- Role Based Access Control
- Helmet security headers
- Upstash Rate Limiter
- Server-side validation
- Client-side validation
- Server-verified payment transactions (no client-trusted payment confirmations)

---

# 🚀 Upcoming Features

- Dashboard Analytics
- Reports
- Fine Payment Email Notifications (to both Reader and Admin)
- Book Barcode Scanning for Borrow / Return
- Activity Logs
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
- eSewa Payment Gateway
