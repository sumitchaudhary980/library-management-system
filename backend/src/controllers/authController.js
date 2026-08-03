const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const transporter = require("../config/mail");
function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const user = await db
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

exports.changePassword = async (req, res) => {
  const { password, confirmPassword } = req.body;

  try {
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

    await db.prepare(`
      UPDATE users
      SET
        password = ?,
        must_change_password = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, userId);

    const user = await db
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

      return res.json({
        message: "Password changed successfully",
        redirect: "/home",
      });
    });
  } catch (err) {
    console.error("Change password error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {

    let { email } = req.body;


    // ===============================
    // Email validation
    // ===============================

    if (
      !email ||
      typeof email !== "string" ||
      Array.isArray(email)
    ) {

      return res.status(400).json({
        errors: {
          email: "Enter a valid email address",
        },
      });

    }


    email = email.trim().toLowerCase();


    const errors = {};


    if (!email) {

      errors.email = "Email is required";

    }
    else {


      const emailRegex =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;



      if (!emailRegex.test(email)) {

        errors.email =
          "Enter a valid email address";

      }



      // Prevent email header injection
      if (
        email.includes(",") ||
        email.includes(";") ||
        email.includes("\n") ||
        email.includes("\r")
      ) {

        errors.email =
          "Enter a valid email address";

      }



      if (email.length > 254) {

        errors.email =
          "Email is too long";

      }

    }



    if (Object.keys(errors).length) {

      return res.status(400).json({
        errors,
      });

    }



    // ===============================
    // Find user
    // ===============================


    const user = await db.prepare(`
      SELECT
        id,
        first_name,
        email,
        reset_token_expires

      FROM users

      WHERE email = ?
    `).get(email);




    // Prevent account enumeration
    if (!user) {

      return res.json({

        message:
          "If an account exists, a password reset link has been sent.",

      });

    }

    // ===============================
    // Prevent reset spam
    // ===============================

    if (user.reset_token_expires) {

      const expiresAt =
        new Date(
          user.reset_token_expires
        ).getTime();



      // Existing token created within last minute
      if (
        expiresAt - Date.now()
        >
        29 * 60 * 1000
      ) {

        return res.json({

          message:
            "If an account exists, a password reset link has been sent.",

        });

      }

    }




    // ===============================
    // Generate token
    // ===============================


    const rawToken =
      crypto.randomBytes(32).toString("hex");



    const hashedToken =
      hashToken(rawToken);



    const expires =
      new Date(
        Date.now() + 30 * 60 * 1000
      ).toISOString();





    // Store HASH only
    await db.prepare(`
      UPDATE users

      SET
        reset_token = ?,
        reset_token_expires = ?

      WHERE id = ?

    `).run(
      hashedToken,
      expires,
      user.id
    );





    const resetLink =
      `${process.env.APP_URL}/reset-password?token=${rawToken}`;





    const safeName =
      escapeHtml(user.first_name);





    await transporter.sendMail({

      to: user.email,


      subject:
        "Reset Your Kaiser Library Password",


      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>

<body style="margin:0;padding:40px 0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table
          width="620"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background:#ffffff;
            border-radius:14px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(0,0,0,.08);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                background:linear-gradient(135deg,#123458,#1e5a92);
                color:#ffffff;
                padding:40px;
              "
            >

              <h1 style="margin:0;font-size:30px;">
                📚 Kaiser Library
              </h1>

              <p style="margin-top:12px;font-size:16px;">
                Password Reset Request
              </p>

            </td>
          </tr>


          <!-- Content -->
          <tr>
            <td style="padding:40px;">


              <h2
                style="
                  margin-top:0;
                  color:#123458;
                "
              >
                Hello ${user.first_name},
              </h2>



              <p
                style="
                  color:#555;
                  font-size:15px;
                  line-height:1.8;
                "
              >

                We received a request to reset the password for your
                <strong>Kaiser Library</strong> account.

              </p>



              <p
                style="
                  color:#555;
                  font-size:15px;
                  line-height:1.8;
                "
              >

                Click the button below to securely create a new password.
                This password reset link will remain valid for
                <strong>30 minutes</strong>.

              </p>




              <div
                style="
                  text-align:center;
                  margin:35px 0;
                "
              >

                
                  href="${resetLink}"
                  style="
                    background:#123458;
                    color:#ffffff;
                    text-decoration:none;
                    padding:15px 35px;
                    border-radius:8px;
                    font-weight:bold;
                    font-size:16px;
                    display:inline-block;
                  "
                >
                  Reset Your Password
                </a>


              </div>





              <div
                style="
                  background:#fff8e7;
                  border-left:5px solid #d4a017;
                  padding:18px;
                  border-radius:8px;
                  margin-bottom:30px;
                "
              >

                <strong style="color:#8a6500;">
                  ⚠ Security Notice
                </strong>


                <p
                  style="
                    margin-top:10px;
                    color:#555;
                    line-height:1.7;
                  "
                >

                  If you didn't request this password reset, you can safely
                  ignore this email. Your password will remain unchanged.
                  This reset link will automatically expire after
                  <strong>30 minutes</strong>.

                </p>


              </div>





              <p
                style="
                  color:#555;
                  line-height:1.8;
                "
              >

                If the button above doesn't work, copy and paste the following
                link into your browser:

              </p>



              <p style="word-break:break-word;">

                
                  href="${resetLink}"
                  style="
                    color:#123458;
                    text-decoration:none;
                    font-weight:600;
                  "
                >

                  ${resetLink}

                </a>

              </p>





              <hr
                style="
                  margin:35px 0;
                  border:none;
                  border-top:1px solid #eeeeee;
                "
              >





              <p
                style="
                  margin-top:30px;
                  color:#555;
                "
              >

                Regards,<br>

                <strong>Kaiser Library Team</strong>

              </p>



            </td>
          </tr>





          <!-- Footer -->

          <tr>

            <td
              align="center"
              style="
                background:#f8fafc;
                padding:18px;
                color:#888;
                font-size:13px;
              "
            >

              © ${new Date().getFullYear()} Kaiser Library. All Rights Reserved.

            </td>

          </tr>



        </table>

      </td>
    </tr>
  </table>


</body>
</html>
`,

    });





    return res.json({

      message:
        "If an account exists, a password reset link has been sent.",

    });



  }
  catch (err) {


    console.error(
      "Forgot password error:",
      err
    );


    return res.status(500).json({

      message:
        "Server error",

    });


  }

};
exports.resetPassword = async (req, res) => {

  try {

    const {
      token,
      password,
      confirmPassword
    } = req.body;



    // ===============================
    // Validate token exists
    // ===============================

    if (!token) {

      return res.status(400).json({
        message: "Invalid password reset link."
      });

    }



    // ===============================
    // Validate password fields
    // ===============================

    if (!password || !confirmPassword) {

      return res.status(400).json({
        message: "Password fields are required."
      });

    }



    if (password !== confirmPassword) {

      return res.status(400).json({
        message: "Passwords do not match."
      });

    }



    if (password.length < 8) {

      return res.status(400).json({
        message: "Password must be at least 8 characters."
      });

    }




    // ===============================
    // Hash incoming token
    // ===============================

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");





    // ===============================
    // Find user using hashed token
    // ===============================

    const user = await db.prepare(`

      SELECT
        id,
        reset_token_expires

      FROM users

      WHERE reset_token = ?

    `).get(tokenHash);





    if (!user) {

      return res.status(400).json({

        message:
          "Invalid or expired reset link."

      });

    }





    // ===============================
    // Check token expiry
    // ===============================

    const expired =
      !user.reset_token_expires ||
      new Date(user.reset_token_expires).getTime() <= Date.now();





    if (expired) {


      await db.prepare(`

        UPDATE users

        SET
          reset_token = NULL,
          reset_token_expires = NULL

        WHERE id = ?

      `).run(user.id);



      return res.status(400).json({

        message:
          "Your password reset link has expired. Please request a new one."

      });

    }






    // ===============================
    // Hash new password
    // ===============================

    const hashedPassword =
      await bcrypt.hash(password, 10);






    // ===============================
    // Update password and remove token
    // ===============================

    await db.prepare(`
  UPDATE users
  SET
    password = ?,
    reset_token = NULL,
    reset_token_expires = NULL,
    must_change_password = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`).run(
      hashedPassword,
      user.id
    );


    // Destroy all sessions of this user
    // NOTE: see flagged issue below this file — this block needs to be
    // conditional on environment before deploying to production.
    if (process.env.NODE_ENV !== "production") {
      const Database = require("better-sqlite3");
      const path = require("path");

      const sessionDb = new Database(
        path.join(__dirname, "../database/sessions.sqlite")
      );

      sessionDb.prepare(`
        DELETE FROM sessions
        WHERE sess LIKE ?
      `).run(`%"id":${user.id}%`);

      sessionDb.close();
    }


    return res.json({
      message: "Password reset successfully. Please login again."
    });




  }
  catch (error) {


    console.error(
      "Reset password error:",
      error
    );



    return res.status(500).json({

      message:
        "Server error."

    });


  }

};

exports.logout = (req, res) => {
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

exports.getSession = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  res.json({
    user: req.session.user,
  });
};