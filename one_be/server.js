import express from "express";
import session from "express-session";
// import MySQLStore from "express-mysql-session"; // Import express-mysql-session
import passport from "passport";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import authRoutes from "./routes/auth.js"; // Import auth routes
import diaryRoutes from "./routes/diary.js";
import eventsRoutes from "./routes/events.js";
import foodsRoutes from "./routes/foods.js";
import healthcareRoutes from "./routes/healthcare.js";
import mealsRoutes from "./routes/meals.js";
import stopwatchRoutes from "./routes/stopwatch.js";
import templatesRoutes from "./routes/templates.js";
import todosRoutes from "./routes/todos.js";
import db from "./config/db.js"; // Import the database connection pool
import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import crypto from "crypto"; // Import crypto for generating random password
import fs from "fs"; // Import fs for directory check

// ==================
// 기본 설정
// ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();
const PORT = 3001;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// MySQLStore 설정 (주석 처리 또는 제거)
// const sessionStore = new MySQLStore(session, {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     clearExpired: true, // Clear expired sessions
//     checkExpirationInterval: 900000, // How frequently to check for expired sessions (in ms)
//     expiration: 86400000, // The maximum age of a session (in ms)
//     createDatabaseTable: true, // Create the session table if it doesn't exist
//     schema: {
//         tableName: 'sessions',
//         columnNames: {
//             session_id: 'session_id',
//             expires: 'expires',
//             data: 'data'
//         }
//     }
// });

// ==================
// CORS 설정 (React 연동)
// ==================
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// ==================
// JSON 파싱 미들웨어
// ==================
app.use(express.json());

// ==================
// Static file serving for uploads
// ==================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================
// session 설정
// ==================
app.use(
  session({
    secret: "dev-secret",
    resave: false,
    saveUninitialized: false,
    // store: sessionStore, // Use MySQLStore for session storage (제거)
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

// ==================
// passport 초기화
// ==================
app.use(passport.initialize());
app.use(passport.session());

// ==================
// Google OAuth 전략
// ==================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const connection = await db.getConnection();
      try {
        // Check if user already exists in our DB
        const [users] = await connection.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);

        if (users.length > 0) {
          // User found, return our internal user object
          return done(null, users[0]);
        } else {
          // No user found with this google_id, create a new one
          const randomPassword = crypto.randomBytes(16).toString('hex'); // Generate a random string
          const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the random string

          const newUser = {
            google_id: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword, // Store the hashed random password
          };
          const [result] = await connection.query('INSERT INTO users SET ?', newUser);
          const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
          return done(null, createdUser[0]);
        }
      } catch (err) {
        console.error("GoogleStrategy error:", err);
        return done(err, null);
      } finally {
        if (connection) connection.release();
      }
    }
  )
);

// ==================
// passport 세션 처리
// ==================
passport.serializeUser((user, done) => {
  // Store only the internal user ID (from our database) in the session
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const connection = await db.getConnection();
  try {
    // Fetch the user from our database using the internal ID
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length > 0) {
      done(null, users[0]); // Attach our internal user object to req.user
    } else {
      done(new Error('User not found'), null);
    }
  } catch (err) {
    console.error("deserializeUser error:", err);
    done(err, null);
  } finally {
    if (connection) connection.release();
  }
});

// ==================
// Google 로그인 시작
// ==================
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// ==================
// Google 로그인 콜백
// ==================
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-fail",
  }),
  (req, res) => {
    // 로그인 성공 → React로 이동
    res.redirect("http://localhost:3000");
  }
);

// ==================
// 로그아웃
// ==================
app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => { // req.logout requires a callback
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({ msg: "Logged out successfully" });
    });
  });
});

// ==================
// 로그인 실패 확인용
// ==================
app.get("/login-fail", (req, res) => {
  res.send("Google Login Failed");
});

// ==================
// 현재 로그인 사용자 정보 반환
// ==================
app.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    // passport가 req.user에 사용자 정보를 저장합니다.
    res.json({
      isLoggedIn: true,
      user: req.user,
      userId: req.user.id // Assuming user.id is available from passport profile
    });
  } else {
    res.status(401).json({ isLoggedIn: false, message: "Not authenticated" });
  }
});

// ==================
// 라우터 연결
// ==================
app.use("/api/auth", authRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/foods", foodsRoutes);
app.use("/api/healthcare", healthcareRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/stopwatch", stopwatchRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/todos", todosRoutes);

// ==================
// 서버 실행
// ==================
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
