const db = require("../config/db");

const createGenreSeeder = async () => {
  const genres = [
    "Fantasy",
    "Science Fiction",
    "Romance",
    "Mystery",
    "Horror",
    "Biography",
    "History",
    "Adventure",
    "Programming",
    "Self Help",
    "Thriller",
    "Poetry"
  ];

  const stmt = await db.prepare(`
    INSERT INTO genres (name)
    VALUES (?)
  `);

  const insertMany = await db.transaction((genres) => {
    for (const genre of genres) {
      stmt.run(genre);
    }
  });

  insertMany(genres);
  console.log("Genres seeded successfully.");
};

module.exports = {
  createGenreSeeder
};