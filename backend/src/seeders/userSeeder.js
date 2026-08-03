const db = require("../config/db");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

const uploadToCloudinary = (filePath) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "heritage-library/users",
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

        const users = [
            {
                first_name: "John",
                last_name: "Doe",
                gender: "male",
                email: "john@gmail.com",
                phone: "9812345678",
                password: "User@12345",
                role: "reader",
                address: "Kathmandu, Nepal",
            },
            {
                first_name: "Jane",
                last_name: "Smith",
                gender: "female",
                email: "jane@gmail.com",
                phone: "9801234567",
                password: "User@12345",
                role: "reader",
                address: "Pokhara, Nepal",
            },
        ];

        for (const user of users) {
            const existingUser = db
                .prepare("SELECT * FROM users WHERE email = ?")
                .get(user.email);

            if (existingUser) {
                console.log(`${user.email} already exists`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);

           await db.prepare(`
                INSERT INTO users (
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
                user.first_name,
                user.last_name,
                user.gender,
                user.email,
                user.phone,
                hashedPassword,
                user.role,
                user.address,
                profileImage,
                profileImagePublicId
            );

            console.log(`${user.email} created successfully`);
        }
    } catch (error) {
        console.error("User Seeder Error:", error);
    }
};

module.exports = { createUserSeeder };