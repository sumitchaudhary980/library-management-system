const db = require("../config/db");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

const uploadToCloudinary = (filePath) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "kaiser-library/users",
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

const createUserSeeder = async () => {
    try {
        const email = "john.doe@gmail.com";

        const user = db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(email);

        if (user) {
            console.log("User already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash("User@12345", 10);

        const imagePath = path.join(
            __dirname,
            "../uploads/users/user.png"
        );

        let profileImage = null;
        let profileImagePublicId = null;

        if (fs.existsSync(imagePath)) {
            const upload = await uploadToCloudinary(imagePath);

            profileImage = upload.secure_url;
            profileImagePublicId = upload.public_id;
        } else {
            console.log("User profile image not found.");
        }

        db.prepare(`
            INSERT INTO users
            (
                first_name,
                last_name,
                gender,
                email,
                phone,
                password,
                role,
                address,
                profile_image,
                profile_image_public_id
            )
            VALUES (?,?,?,?,?,?,?,?,?,?)
        `).run(
            "John",
            "Doe",
            "male",
            "john@gmail.com",
            "9812345678",
            hashedPassword,
            "reader",
            "Kathmandu, Nepal",
            profileImage,
            profileImagePublicId
        );

        console.log("✅ User created successfully");
    } catch (error) {
        console.error("❌ User Seeder Error:", error);
    }
};

module.exports = { createUserSeeder };