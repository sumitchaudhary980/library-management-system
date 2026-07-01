const db = require("../config/db");


exports.getAuthors = (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const search = req.query.search || "";

  const offset = (page - 1) * limit;


  try {

    const total = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM authors
        WHERE name LIKE ?
        `
      )
      .get(`%${search}%`).total;


    const authors = db
      .prepare(
        `
        SELECT *
        FROM authors
        WHERE name LIKE ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        `
      )
      .all(
        `%${search}%`,
        limit,
        offset
      );


    res.json({
      authors,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });


  } catch(err){

    res.status(500).json({
      message: err.message
    });

  }

};



exports.deleteAuthor = (req,res)=>{


  const id = req.params.id;


  try {


    const result = db
      .prepare(
        `
        DELETE FROM authors
        WHERE id = ?
        `
      )
      .run(id);



    if(result.changes === 0){

      return res.status(404).json({
        message:"Author not found"
      });

    }



    res.json({
      message:"Author deleted successfully"
    });


  } catch(err){

    res.status(500).json({
      message:err.message
    });

  }

};