const bcrypt = require("bcrypt");
const db = require("../config/db");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }

  try {
    const user = db
      .prepare("SELECT * FROM users WHERE email = ? OR phone = ?")
      .get(email, email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Detect which login endpoint was used
    if (req.loginRole === "admin" && user.role !== "admin") {
      return res.status(403).json({
        message: "Invalid credentials",
      });
    }

    if (req.loginRole === "reader" && user.role !== "reader") {
      return res.status(403).json({
        message: "Invalid credentials",
      });
    }
    const redirectMap = {
      admin: "/dashboard",
      reader: "/home",
    };
    // Create session
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          message: "Server error"
        });
      }

      req.session.user = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      };

      return res.json({
        message: "Login successful",
        role: user.role,
        redirect: redirectMap[user.role],
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Logout failed",
      });
    }

    res.clearCookie("sid");

    res.json({
      message: "Logged out successfully",
    });
  });
};

const getSession = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  res.json({
    user: req.session.user,
  });
};

module.exports = {
  login,
  logout,
  getSession,
};