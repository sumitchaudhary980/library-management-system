const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

const uploadToCloudinary = (filePath) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "kaiser-library/books",
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        fs.createReadStream(filePath).pipe(uploadStream);
    });
};

const createBookSeeder = async () => {
    try {
        const books = [
            {
                title: "Harry Potter and the Sorcerer's Stone",
                authorName: "J.K. Rowling",
                genre: "Fantasy",
                file: "harry-potter.jpg",
                stock: 12,
            },
            {
                title: "1984",
                authorName: "George Orwell",
                genre: "Science Fiction",
                file: "1984.jpg",
                stock: 10,
            },
            {
                title: "Pride and Prejudice",
                authorName: "Jane Austen",
                genre: "Romance",
                file: "pride-and-prejudice.jpg",
                stock: 8,
            },
            {
                title: "Adventures of Huckleberry Finn",
                authorName: "Mark Twain",
                genre: "Adventure",
                file: "adventures-of-huckleberry-finn.jpg",
                stock: 7,
            },
            {
                title: "The Alchemist",
                authorName: "Paulo Coelho",
                genre: "Adventure",
                file: "the-alchemist.jpg",
                stock: 15,
            },
            {
                title: "War and Peace",
                authorName: "Leo Tolstoy",
                genre: "History",
                file: "war-and-peace.jpg",
                stock: 6,
            },
            {
                title: "Crime and Punishment",
                authorName: "Fyodor Dostoevsky",
                genre: "Mystery",
                file: "crime-and-punishment.jpg",
                stock: 9,
            },
            {
                title: "Oliver Twist",
                authorName: "Charles Dickens",
                genre: "History",
                file: "oliver-twist.jpg",
                stock: 11,
            },
            {
                title: "The Old Man and the Sea",
                authorName: "Ernest Hemingway",
                genre: "Adventure",
                file: "the-old-man-and-the-sea.jpg",
                stock: 5,
            },
            {
                title: "Hamlet",
                authorName: "William Shakespeare",
                genre: "Poetry",
                file: "hamlet.jpg",
                stock: 13,
            },
            {
                title: "Murder on the Orient Express",
                authorName: "Agatha Christie",
                genre: "Mystery",
                file: "murder-on-the-orient-express.jpg",
                stock: 8,
            },
            {
                title: "The Shining",
                authorName: "Stephen King",
                genre: "Horror",
                file: "the-shining.jpg",
                stock: 10,
            },
            {
                title: "The Da Vinci Code",
                authorName: "Dan Brown",
                genre: "Thriller",
                file: "the-da-vinci-code.jpg",
                stock: 14,
            },
            {
                title: "Norwegian Wood",
                authorName: "Haruki Murakami",
                genre: "Romance",
                file: "norwegian-wood.jpg",
                stock: 7,
            },
            {
                title: "The Kite Runner",
                authorName: "Khaled Hosseini",
                genre: "Biography",
                file: "the-kite-runner.jpg",
                stock: 9,
            },
        ];

        const insertStmt = db.prepare(`
            INSERT INTO books
            (title, author_id, genre_id, stock_quantity, cover_image)
            VALUES (?, ?, ?, ?, ?)
        `);

        const basePath = path.join(__dirname, "../uploads/book-covers");

        // ================================
        // STEP 1: Async processing (NO transaction here)
        // ================================
        const processedBooks = [];

        for (const book of books) {
            const author = db
                .prepare(`SELECT id FROM authors WHERE name = ?`)
                .get(book.authorName);

            const genre = db
                .prepare(`SELECT id FROM genres WHERE name = ?`)
                .get(book.genre);

            if (!author || !genre) {
                console.log(`Skipping ${book.title}`);
                continue;
            }

            const filePath = path.join(basePath, book.file);

            if (!fs.existsSync(filePath)) {
                console.log(`Image not found: ${filePath}`);
                continue;
            }

            // ✅ async allowed here
            const upload = await uploadToCloudinary(filePath);

            processedBooks.push({
                title: book.title,
                authorId: author.id,
                genreId: genre.id,
                stock: book.stock,
                cover: upload.secure_url,
            });
        }

        // ================================
        // STEP 2: SYNC SQLite transaction
        // ================================
        const insertMany = db.transaction((books) => {
            for (const book of books) {
                insertStmt.run(
                    book.title,
                    book.authorId,
                    book.genreId,
                    book.stock,
                    book.cover
                );

                console.log(`Inserted: ${book.title}`);
            }
        });

        insertMany(processedBooks);

        console.log("✅ Book seeding completed successfully");
    } catch (err) {
        console.error("❌ Seeder error:", err);
    }
};

module.exports = { createBookSeeder };