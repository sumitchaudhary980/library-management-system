# 📚 Library Management System

A full-stack **Library Management System** developed using **HTML, CSS, JavaScript, Node.js, Express.js, and SQLite**.

This project provides a digital platform for managing library operations through an intuitive admin dashboard. It currently focuses on library resource management, including books, authors, genres, secure authentication, and cloud-based image management using **Cloudinary**.

The application follows a separate **frontend** and **backend** architecture to ensure a clean, scalable, and maintainable project structure.

---

# 🚧 Project Status

**Status:** Under Development

This project is currently under active development. Core administration features have been implemented, while additional library modules and user-facing functionality are planned for future releases.

---

# ✨ Project Overview

The Library Management System aims to simplify library management by providing administrators with tools to efficiently organize library resources.

### Current Features

- Admin authentication
- Dashboard
- Book management
- Author management
- Genre management
- Book cover image upload
- Cloudinary image management
- Search and filtering
- Pagination
- Form validation
- Responsive admin interface

### Planned Features

- User authentication
- Borrow books
- Return books
- Due date tracking
- Fine management
- Borrowing history
- Book reservation system

---

# 🛠️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript

## Backend

- Node.js
- Express.js

## Database

- SQLite

## Cloud Storage

- Cloudinary

## Additional Technologies

- bcrypt (Password hashing)
- Multer (Multipart form handling)
- Better SQLite3
- Express Sessions

---

# ☁️ Image Management

Book cover images are securely stored using **Cloudinary**.

Current image features include:

- Uploading book cover images
- Cloud-based image storage
- Automatic image replacement
- Automatic deletion of old images
- Optimized image delivery

---

# 📂 Project Structure

```text
Library-Management-System/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   │
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── admin/
│   ├── user/
│   ├── assets/
│   └── index.html
│
├── README.md
├── LICENSE
└── .gitignore
```

---

# 🔐 Main System Modules

## Admin Module

The admin dashboard currently provides:

- Dashboard
- Manage books
- Manage authors
- Manage genres
- Upload and update book cover images
- Delete books and associated Cloudinary images
- Search books
- Pagination
- Form validation

---

## User Module (Planned)

The user module is planned to include:

- User registration
- User login
- Browse books
- Borrow books
- Return books
- Renew borrowed books
- Borrowing history
- Fine management

---

# 📖 Library Operations

The system currently supports:

- Adding books
- Updating books
- Deleting books
- Managing stock quantity
- Managing authors
- Managing genres
- Uploading book cover images
- Updating existing cover images
- Automatic removal of replaced images
- Search functionality
- Pagination

---

# 🔒 Security

The application focuses on:

- Secure authentication
- Password hashing using bcrypt
- Protected admin routes
- Server-side validation
- Client-side validation
- Secure file upload validation
- Cloud-based image storage
- Automatic cleanup of deleted images

---

# 🚀 Future Enhancements

Planned improvements include:

- User management
- Borrow and return management
- Fine calculation
- Dashboard analytics
- Email notifications
- Activity logs
- Book reservation system
- Barcode / QR code support
- Report generation
- Role-based access control
- Advanced search and filtering

---

# ⚙️ Installation

Installation instructions will be added once the project reaches a stable release.

The project is currently under active development, and setup steps may change as new features and configurations are introduced.

---

# 📄 License

This project is licensed under the **MIT License**.

Copyright © 2026 Sumit Kumar Chaudhary.

---

# 👨‍💻 Developed By

**Sumit Kumar Chaudhary**

GitHub: https://github.com/sumitchaudhary980

Email: jaiswalsumit1010@gmail.com

---

## Built With

- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- SQLite
- Cloudinary
- Multer
- bcrypt
