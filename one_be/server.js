import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import MySQLStore from "express-mysql-session"; // Import express-mysql-session
// ...
// MySQLStore 설정 (주석 처리 또는 제거)
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: 3306, // Assuming default MySQL port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true, // Clear expired sessions
    checkExpirationInterval: 900000, // How frequently to check for expired sessions (in ms)
    expiration: 86400000, // The maximum age of a session (in ms)
    createDatabaseTable: true, // Create the session table if it doesn't exist
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

// ==================
// CORS 설정 (React 연동)
// ==================
app.use(
  cors({
    origin: "https://oneday-b9a73.web.app",
    credentials: true,
  })
);

// ==================
// JSON 파싱 미들웨어
// ==================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    store: sessionStore, // Use MySQLStore for session storage
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: true,
      sameSite: "none"
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
                callbackURL: "https://44.220.190.131.nip.io/api/auth/google/callback",      passReqToCallback: true // Add this line
    },
    async (req, accessToken, refreshToken, profile, done) => { // Add req here
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction(); // START TRANSACTION
        const userEmail = profile.emails[0].value.trim().toLowerCase();

        // Check if user already exists by google_id, and lock the row
        const [users] = await connection.query('SELECT * FROM users WHERE google_id = ? FOR UPDATE', [profile.id]);

        if (users.length > 0) {
          // User found, no need to update anything here unless necessary
          await connection.commit(); // COMMIT
          return done(null, users[0]);
        }

        // No user with google_id, check for existing email and lock the row
        const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ? FOR UPDATE', [userEmail]);

        if (existingUsers.length > 0) {
          // User with email exists, link google_id
          const user = existingUsers[0];
          await connection.query('UPDATE users SET google_id = ? WHERE id = ?', [profile.id, user.id]);
          await connection.commit(); // COMMIT
          return done(null, user);
        }

        // No user found, create a new one
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const newUser = {
          google_id: profile.id,
          username: profile.displayName,
          real_name: profile.displayName,
          email: userEmail,
          password: hashedPassword,
          provider: 'google',
          profile_image_url: null,
        };
        const [result] = await connection.query('INSERT INTO users SET ?', newUser);
        const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        
        await connection.commit(); // COMMIT
        req.session.isNewUser = true;
        return done(null, createdUser[0]);

      } catch (err) {
        if (connection) await connection.rollback(); // ROLLBACK on error
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
                  callbackURL: "https://44.220.190.131.nip.io/api/auth/kakao/callback",
                  passReqToCallback: true // Add this line
              },    async (req, accessToken, refreshToken, profile, done) => { // Add req here
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction(); // START TRANSACTION

        // Check if user already exists by kakao_id and lock the row
        const [users] = await connection.query('SELECT * FROM users WHERE kakao_id = ? FOR UPDATE', [profile.id]);

        if (users.length > 0) {
          await connection.commit(); // COMMIT
          return done(null, users[0]);
        }

        // No user with kakao_id, check for existing email
        const userEmail = profile._json.kakao_account.email ? profile._json.kakao_account.email.trim().toLowerCase() : null;
        if (userEmail) {
          const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ? FOR UPDATE', [userEmail]);
          if (existingUsers.length > 0) {
            const user = existingUsers[0];
            await connection.query('UPDATE users SET kakao_id = ? WHERE id = ?', [profile.id, user.id]);
            await connection.commit(); // COMMIT
            return done(null, user);
          }
        }

        // No user found, create a new one
        const finalEmail = userEmail ? userEmail : `kakao_${profile.id}@one.day`; // Use placeholder if email is null

        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const newUser = {
          kakao_id: profile.id,
          username: profile.username,
          real_name: profile.username,
          email: finalEmail,
          password: hashedPassword,
          provider: 'kakao',
        };
        const [result] = await connection.query('INSERT INTO users SET ?', newUser);
        const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        
        await connection.commit(); // COMMIT
        req.session.isNewUser = true;
        return done(null, createdUser[0]);

      } catch (err) {
        if (connection) await connection.rollback(); // ROLLBACK on error
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
                callbackURL: "https://44.220.190.131.nip.io/api/auth/naver/callback",      passReqToCallback: true // Add this line
    },
    async (req, accessToken, refreshToken, profile, done) => { // Add req here
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction(); // START TRANSACTION
        console.log("NaverStrategy: Profile received:", profile);

        // Check if user already exists by naver_id and lock the row
        const [users] = await connection.query('SELECT * FROM users WHERE naver_id = ? FOR UPDATE', [profile.id]);

        if (users.length > 0) {
          console.log("NaverStrategy: User found by naver_id:", users[0].id);
          await connection.commit(); // COMMIT
          return done(null, users[0]);
        }

        // No user with naver_id, check for existing email
        const rawEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const userEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
        console.log("NaverStrategy: User email:", userEmail);

        if (userEmail) {
          const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ? FOR UPDATE', [userEmail]);
          if (existingUsers.length > 0) {
            const user = existingUsers[0];
            console.log("NaverStrategy: User found by email, linking naver_id:", user.id);
            await connection.query('UPDATE users SET naver_id = ? WHERE id = ?', [profile.id, user.id]);
            await connection.commit(); // COMMIT
            return done(null, user);
          }
        }

        // No user found, create a new one
        const finalEmail = userEmail ? userEmail : `naver_${profile.id}@one.day`; // Use placeholder if email is null
        console.log("NaverStrategy: Creating new user with email:", finalEmail);

        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const newUser = {
          naver_id: profile.id,
          username: profile.displayName,
          real_name: profile.displayName,
          email: finalEmail,
          password: hashedPassword,
          provider: 'naver',
        };
        const [result] = await connection.query('INSERT INTO users SET ?', newUser);
        const [createdUser] = await connection.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        
        await connection.commit(); // COMMIT
        req.session.isNewUser = true;
        console.log("NaverStrategy: New user created:", createdUser[0].id);
        return done(null, createdUser[0]);

      } catch (err) {
        if (connection) await connection.rollback(); // ROLLBACK on error
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
      const user = users[0];
      // Set a default profile image if none is provided or if it's broken
      if (!user.profile_image_url || user.profile_image_url === '') {
        user.profile_image_url = '/uploads/default_image.png'; // Assuming a default image exists here
      }
      done(null, user); // Attach our internal user object to req.user
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
    let redirectUrl = "https://oneday-b9a73.web.app";
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
  passport.authenticate("kakao", {
    scope: ["account_email"], // Request email from user
  })
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
    let redirectUrl = "https://oneday-b9a73.web.app";
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
    let redirectUrl = "https://oneday-b9a73.web.app";
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
  console.log("Login failed: Redirected to /login-fail");
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
app.use("/api/diaries", diaryRoutes);
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

