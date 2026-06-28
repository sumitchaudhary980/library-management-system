const express = require("express");
const cors = require("cors");
const path = require("path");

require("./config/initDb");

const pageRoute = require("./routes/pageRoute");
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, "../../frontend")));

app.use("/", pageRoute);

app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);


app.listen(3000, () => {
    console.log("Server running on port 3000");
});