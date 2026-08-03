const db = require("../config/db");

const createAuthorSeeder = async() => {
  const authors = [
    {
      name: "J.K. Rowling",
      biography: "British author best known for the Harry Potter series.",
    },

    {
      name: "George Orwell",
      biography: "English novelist, essayist, and critic.",
    },

    {
      name: "Jane Austen",
      biography: "English novelist known for Pride and Prejudice.",
    },

    {
      name: "Mark Twain",
      biography: "American writer and humorist.",
    },

    {
      name: "Paulo Coelho",
      biography: "Brazilian author of The Alchemist.",
    },

    {
      name: "Leo Tolstoy",
      biography: "Russian writer known for War and Peace and Anna Karenina.",
    },

    {
      name: "Fyodor Dostoevsky",
      biography: "Russian novelist famous for Crime and Punishment.",
    },

    {
      name: "Charles Dickens",
      biography: "English writer known for Oliver Twist and A Christmas Carol.",
    },

    {
      name: "Ernest Hemingway",
      biography: "American novelist and short story writer.",
    },

    {
      name: "William Shakespeare",
      biography: "English playwright and poet.",
    },

    {
      name: "Agatha Christie",
      biography: "British mystery writer known for detective novels.",
    },

    {
      name: "Stephen King",
      biography: "American author known for horror and suspense novels.",
    },

    {
      name: "Dan Brown",
      biography: "American author known for thriller novels.",
    },

    {
      name: "Haruki Murakami",
      biography: "Japanese writer known for surreal fiction.",
    },

    {
      name: "Khaled Hosseini",
      biography: "Afghan-American novelist known for The Kite Runner.",
    },
  ];

  const stmt = await db.prepare(`

    INSERT INTO authors (name, biography)

    VALUES (?, ?)

  `);

  const insertMany = db.transaction((authors) => {
    for (const author of authors) {
      stmt.run(
        author.name,

        author.biography,
      );
    }
  });

  insertMany(authors);

  console.log("Authors seeded successfully.");
};

module.exports = { createAuthorSeeder };
