const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
  
});
const axios = require("axios");
const db = require("./config/db");
async function updateBookDescriptions() {
  try {
    const books = db
      .prepare(
        `
        SELECT 
          books.id,
          books.title,
          authors.name AS author_name
        FROM books
        JOIN authors
        ON books.author_id = authors.id
        WHERE books.description IS NULL 
        OR books.description = ''
      `
      )
      .all();

    console.log(`Found ${books.length} books to update`);

    for (const book of books) {
      try {
        console.log(
          `Searching: ${book.title} - ${book.author_name}`
        );

        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
            book.title
          )}+inauthor:${encodeURIComponent(
            book.author_name
          )}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
        );

        let description = "";

        if (
          response.data.items &&
          response.data.items.length > 0
        ) {
          description =
            response.data.items[0].volumeInfo.description || "";
        }

        if (description) {
          db.prepare(
            `
            UPDATE books
            SET description = ?
            WHERE id = ?
          `
          ).run(description, book.id);

          console.log(`Updated: ${book.title}`);
        } else {
          console.log(
            `No description found: ${book.title}`
          );
        }

        // avoid hitting API too fast
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

      } catch (err) {
        console.log(
          `Failed: ${book.title}`,
          err.message
        );
      }
    }

    console.log("Book descriptions update completed");

  } catch (err) {
    console.log(err);
  }
}

updateBookDescriptions();