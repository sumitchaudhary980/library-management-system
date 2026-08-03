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

const createAdminSeeder = async () => {
    try {
        const email = "jaiswalsumit1010@gmail.com";

        const admin = db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(email);

        if (admin) {
            console.log("Admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash("Herald@12345", 10);

        // Path to admin image
        const imagePath = path.join(
            __dirname,
            "../uploads/users/admin.jpg"
        );

        let profileImage = null;
        let profileImagePublicId = null;

        if (fs.existsSync(imagePath)) {
            const upload = await uploadToCloudinary(imagePath);

            profileImage = upload.secure_url;
            profileImagePublicId = upload.public_id;
        } else {
            console.log("Admin profile image not found.");
        }

        await db.prepare(`
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
            "Sumit",
            "Chaudhary",
            "male",
            email,
            "9704181697",
            hashedPassword,
            "admin",
            "Library",
            profileImage,
            profileImagePublicId
        );

        console.log("✅ Admin created successfully");
    } catch (error) {
        console.error("❌ Admin Seeder Error:", error);
    }
};

module.exports = { createAdminSeeder };