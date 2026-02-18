import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
// import MySQLStore from "express-mysql-session"; // Import express-mysql-session
import passport from "passport";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { Strategy as NaverStrategy } from "passport-naver"; // Import NaverStrategy
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
      passReqToCallback: true // Add this line
    },
    async (req, accessToken, refreshToken, profile, done) => { // Add req here
      const connection = await db.getConnection();
      try {
        // Check if user already exists in our DB
        const [users] = await connection.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);

        if (users.length > 0) {
          // User found, update only real_name if it's NULL or empty
          let user = users[0];
          const updates = [];
          const params = [];

          // Only update real_name if it's currently NULL or an empty string
          if (user.real_name === null || user.real_name === '') {
            updates.push('real_name = ?');
            params.push(profile.displayName);
          }
          // username and profile_image_url are NOT updated to preserve user customizations

          if (updates.length > 0) {
            params.push(user.id);
            const updateSql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            await connection.query(updateSql, params);
            // Re-fetch user to get updated data
            const [updatedUsers] = await connection.query('SELECT * FROM users WHERE id = ?', [user.id]);
            user = updatedUsers[0];
          }
          return done(null, user);
        } else {
          // No user found with this google_id, create a new one
          const randomPassword = crypto.randomBytes(16).toString('hex'); // Generate a random string
          const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the random string

          const newUser = {
            google_id: profile.id,
            username: profile.displayName,
            real_name: profile.displayName, // Add real_name field
            email: profile.emails[0].value,
            password: hashedPassword, // Store the hashed random password
            provider: 'google', // Add provider field
            profile_image_url: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null, // Add profile image
          };
          const [result] = await connection.query('INSERT INTO users SET ?', newUser);
          const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
          req.session.isNewUser = true; // Set flag for new user
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
// Kakao OAuth 전략
// ==================
passport.use(
          new KakaoStrategy(
              {
                  clientID: process.env.KAKAO_CLIENT_ID,
                  clientSecret: process.env.KAKAO_CLIENT_SECRET,
                  callbackURL: "http://localhost:3001/auth/kakao/callback",
                  passReqToCallback: true // Add this line
              },    async (req, accessToken, refreshToken, profile, done) => { // Add req here
      const connection = await db.getConnection();
      try {
        // Check if user already exists in our DB
        const [users] = await connection.query('SELECT * FROM users WHERE kakao_id = ?', [profile.id]);

        if (users.length > 0) {
          // User found, return our internal user object
          return done(null, users[0]);
        } else {
          // No user found with this kakao_id, create a new one
          const randomPassword = crypto.randomBytes(16).toString('hex'); // Generate a random string
          const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the random string

          const newUser = {
            kakao_id: profile.id,
            username: profile.username, // Use profile.username for nickname
            real_name: profile.username, // Use profile.username for real_name as well
            // email: profile._json.kakao_account.email, // 카카오 정책상 이메일 수집 안 함
            password: hashedPassword, // Store the hashed random password
            provider: 'kakao', // Add provider field
          };
          const [result] = await connection.query('INSERT INTO users SET ?', newUser);
          const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
          req.session.isNewUser = true; // Set flag for new user
          return done(null, createdUser[0]);
        }
      } catch (err) {
        console.error("KakaoStrategy error:", err);
        return done(err, null);
      } finally {
        if (connection) connection.release();
      }
    }
  )
);

// ==================
// Naver OAuth 전략
// ==================
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/naver/callback",
      passReqToCallback: true // Add this line
    },
    async (req, accessToken, refreshToken, profile, done) => { // Add req here
      const connection = await db.getConnection();
      try {
        // Check if user already exists in our DB
        const [users] = await connection.query('SELECT * FROM users WHERE naver_id = ?', [profile.id]);

        if (users.length > 0) {
          // User found, return our internal user object
          return done(null, users[0]);
        } else {
          // No user found with this naver_id, create a new one
          console.log("Naver Profile:", profile); // Debug log for Naver profile
          const randomPassword = crypto.randomBytes(16).toString('hex'); // Generate a random string
          const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the random string

          const newUser = {
            naver_id: profile.id,
            username: profile.displayName,
            real_name: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null, // Naver may not always provide email
            password: hashedPassword, // Store the hashed random password
            provider: 'naver', // Add provider field
          };
          const [result] = await connection.query('INSERT INTO users SET ?', newUser);
          const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
          req.session.isNewUser = true; // Set flag for new user
          return done(null, createdUser[0]);
        }
      } catch (err) {
        console.error("NaverStrategy error:", err);
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
    const [users] = await connection.query('SELECT id, username, real_name, email, profile_image_url, weight, provider FROM users WHERE id = ?', [id]);
    if (users.length > 0) {
      done(null, users[0]); // Attach our internal user object to req.user
    } else {
      done(null, false); // Indicate authentication failure, but not an error
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
  (req, res, next) => {
    console.log("Google Auth Options:", { scope: ["profile", "email"], prompt: "consent" });
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "consent" // Force consent screen
    })(req, res, next);
  }
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
    let redirectUrl = "http://localhost:3000";
    if (req.session.isNewUser) {
      redirectUrl += "?status=registered";
      req.session.isNewUser = false; // Clear the flag
    }
    res.redirect(redirectUrl);
  }
);

// ==================
// Kakao 로그인 시작
// ==================
app.get(
  "/auth/kakao",
  (req, res, next) => {
    console.log("Kakao Auth Options:", { auth_type: "reauthenticate" });
    passport.authenticate("kakao", {
      auth_type: "reauthenticate" // Force reauthentication/consent screen
    })(req, res, next);
  }
);

// ==================
// Kakao 로그인 콜백
// ==================
app.get(
  "/auth/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/login-fail",
  }),
  (req, res) => {
    // 로그인 성공 → React로 이동
    let redirectUrl = "http://localhost:3000";
    if (req.session.isNewUser) {
      redirectUrl += "?status=registered";
      req.session.isNewUser = false; // Clear the flag
    }
    res.redirect(redirectUrl);
  }
);

// ==================
// Naver 로그인 시작
// ==================
app.get(
  "/auth/naver",
  (req, res, next) => {
    console.log("Naver Auth Options:", { auth_type: "reprompt" });
    passport.authenticate("naver", {
      auth_type: "reprompt" // Force reprompt/consent screen
    })(req, res, next);
  }
);

// ==================
// Naver 로그인 콜백
// ==================
app.get(
  "/auth/naver/callback",
  passport.authenticate("naver", {
    failureRedirect: "/login-fail",
  }),
  (req, res) => {
    // 로그인 성공 → React로 이동
    let redirectUrl = "http://localhost:3000";
    if (req.session.isNewUser) {
      redirectUrl += "?status=registered";
      req.session.isNewUser = false; // Clear the flag
    }
    res.redirect(redirectUrl);
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
      res.clearCookie('connect.sid'); // Explicitly clear the session cookie
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

