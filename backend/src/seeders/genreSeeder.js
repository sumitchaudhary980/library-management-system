const db = require("../config/db");

const createGenreSeeder = () => {
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

  const stmt = db.prepare(`
    INSERT INTO genres (name)
    VALUES (?)
  `);

  const insertMany = db.transaction((genres) => {
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