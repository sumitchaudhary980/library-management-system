const bcrypt = require("bcrypt");
const db = require("../config/db");

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const user = db
      .prepare("SELECT * FROM users WHERE email = ? OR phone = ?")
      .get(email, email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Block inactive accounts
    if (user.status === "inactive") {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    // Verify login portal
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

    // Reader must change temporary password
    if (user.role === "reader" && user.must_change_password === 1) {
      return req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({
            message: "Server error",
          });
        }

        // Temporary session
        req.session.passwordReset = {
          id: user.id,
          email: user.email,
          role: user.role,
        };

        return res.json({
          requirePasswordChange: true,
          redirect: "/change-password",
        });
      });
    }

    const redirectMap = {
      admin: "/dashboard",
      reader: "/home",
    };

    // Normal login session
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          message: "Server error",
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

const changePassword = async (req, res) => {
  const { password, confirmPassword } = req.body;

  try {
    // Check temporary password session
    if (!req.session.passwordReset) {
      return res.status(401).json({
        message: "Password change session expired. Please login again.",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: "Password fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }


    const userId = req.session.passwordReset.id;


    const hashedPassword = await bcrypt.hash(password, 10);


    db.prepare(`
      UPDATE users
      SET 
        password = ?,
        must_change_password = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      hashedPassword,
      userId
    );


    // Convert reset session into normal login session
    const user = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId);


    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          message: "Session error",
        });
      }


      req.session.user = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      };


      res.json({
        message: "Password changed successfully",
        redirect: "/home",
      });
    });


  } catch (err) {
    console.error("Change password error:", err);

    res.status(500).json({
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
  changePassword,
};