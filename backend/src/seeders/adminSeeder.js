const db = require("../config/db");

const createAdmin = () => {

    const admin = db.prepare(
        "SELECT * FROM users WHERE email = ?"
    ).get("admin@gmail.com");


    if(!admin){

        db.prepare(`
            INSERT INTO users
            (
                first_name,
                last_name,
                email,
                phone,
                password,
                role,
                address
            )
            VALUES (?,?,?,?,?,?,?)
        `).run(
            "Sumit",
            "Chaudhary",
            "jaiswalsumit1010@gmail.com",
            "9704181697",
            "Herald@12345",
            "admin",
            "Library"
        );


        console.log("Admin created");

    }else{

        console.log("Admin already exists");

    }

};


createAdmin();