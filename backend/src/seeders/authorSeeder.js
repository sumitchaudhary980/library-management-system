const db = require("../config/db");

const createAuthorSeeder = () => {
  const authors = [
    {
      name: "J.K. Rowling",
      biography: "British author best known for the Harry Potter series."
    },
    {
      name: "George Orwell",
      biography: "English novelist, essayist, and critic."
    },
    {
      name: "Jane Austen",
      biography: "English novelist known for Pride and Prejudice."
    },
    {
      name: "Mark Twain",
      biography: "American writer and humorist."
    },
    {
      name: "Paulo Coelho",
      biography: "Brazilian author of The Alchemist."
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO authors (name, biography)
    VALUES (?, ?)
  `);

  const insertMany = db.transaction((authors) => {
    for (const author of authors) {
      stmt.run(author.name, author.biography);
    }
  });

  insertMany(authors);

  console.log("Authors seeded successfully.");
};

module.exports = { createAuthorSeeder };