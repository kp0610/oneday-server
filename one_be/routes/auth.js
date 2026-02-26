const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Use db.js for consistency
const crypto = require('crypto'); // Import crypto for generating random password
const nodemailer = require('nodemailer'); // Import nodemailer

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail", // Explicitly set to "gmail"
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
console.log("EMAIL_USER:", process.env.EMAIL_USER); // Log to check if .env is loaded
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****** (loaded)" : "NOT LOADED"); // Log to check if EMAIL_PASS is loaded

// Create a JSON parsing middleware that will be used for specific routes
const jsonParser = express.json();



const allowedDomains = [
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.co.kr", "yahoo.co.jp", "icloud.com", "me.com", "mac.com",
  "naver.com", "daum.net", "hanmail.net", "kakao.com", "nate.com",
  "edu", "ac.kr", "co.kr", "or.kr", "go.kr"
];

// @route   POST /api/auth/send-verification-code
// @desc    Send email verification code
// @access  Public
router.post('/send-verification-code', jsonParser, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ msg: '이메일을 입력해주세요.' });
    }

    // 1. 이메일 형식 정규식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "존재하지 않는 메일입니다." });
    }

    // 2. 허용 도메인 확장 검사
    const domain = email.split("@")[1];
    const isAllowed = allowedDomains.some(d =>
        domain === d || domain.endsWith("." + d)
    );

    if (!isAllowed) {
        return res.status(400).json({ message: "존재하지 않는 메일입니다." });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // Check if email already exists in users table
        const [existingUser] = await connection.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: '이미 가입된 이메일입니다.' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Code expires in 5 minutes

        // Store code in database
        // First, delete any old codes for this email
        await connection.query('DELETE FROM email_verification_codes WHERE email = ?', [email]);
        await connection.query(
            'INSERT INTO email_verification_codes (email, code, expires_at, is_verified_temp) VALUES (?, ?, ?, FALSE)',
            [email, code, expiresAt]
        );

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'OneDay 회원가입 인증번호',
            html: `<p>귀하의 OneDay 회원가입 인증번호는 <b>${code}</b> 입니다.</p><p>5분 이내에 입력해주세요.</p>`,
        });

        res.status(200).json({ msg: '인증번호가 이메일로 발송되었습니다.' });

    } catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({ msg: `인증번호 발송 중 오류 발생: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
});

// @route   POST /api/auth/verify-code
// @desc    Verify email verification code
// @access  Public
router.post('/verify-code', jsonParser, async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ msg: '이메일과 인증번호를 모두 입력해주세요.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            'SELECT * FROM email_verification_codes WHERE email = ? AND code = ?',
            [email, code]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ msg: '유효하지 않은 인증번호입니다.' });
        }

        const verificationEntry = rows[0];
        if (new Date() > new Date(verificationEntry.expires_at)) {
            await connection.query('DELETE FROM email_verification_codes WHERE id = ?', [verificationEntry.id]);
            await connection.commit();
            return res.status(400).json({ msg: '인증번호가 만료되었습니다.' });
        }

        // Code is valid and not expired, mark as verified temporarily
        await connection.query(
            'UPDATE email_verification_codes SET is_verified_temp = TRUE WHERE id = ?',
            [verificationEntry.id]
        );
        await connection.commit();

        res.status(200).json({ msg: '이메일이 성공적으로 인증되었습니다.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Verify code error:', error);
        res.status(500).json({ msg: `인증번호 확인 중 오류 발생: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', jsonParser, async (req, res) => {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
        return res.status(400).json({ msg: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check for existing user
        const [existingUser] = await connection.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(400).json({ msg: '이미 사용중인 이메일입니다.' });
        }

        // Check if email has been verified via code
        const [verifiedEmail] = await connection.query(
            'SELECT * FROM email_verification_codes WHERE email = ? AND is_verified_temp = TRUE AND expires_at > NOW()',
            [email]
        );

        if (verifiedEmail.length === 0) {
            await connection.rollback();
            return res.status(400).json({ msg: '이메일 인증이 완료되지 않았거나 만료되었습니다. 다시 인증해주세요.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            email,
            password: hashedPassword,
            username: nickname,
            is_verified: true, // Set to true as email is pre-verified
        };

        const [result] = await connection.query('INSERT INTO users SET ?', newUser);

        // Clear the temporary verification record
        await connection.query('DELETE FROM email_verification_codes WHERE email = ?', [email]);

        await connection.commit();
        res.status(201).json({
            msg: '회원가입이 완료되었습니다!',
            userId: result.insertId
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Register error:', err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
    } finally {
        if (connection) connection.release();
    }
});





// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', jsonParser, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: '이메일과 비밀번호를 모두 입력해주세요.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ msg: '이메일 또는 비밀번호가 잘못되었습니다.' });
        }

        const user = users[0];
        console.log(`[Login] User ID: ${user.id}, is_verified: ${user.is_verified}`);
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ msg: '이메일 또는 비밀번호가 잘못되었습니다.' });
        }

        if (!user.is_verified) {
            return res.status(401).json({ msg: '이메일 인증이 필요합니다. 이메일을 확인해주세요.' });
        }

        res.status(200).json({ msg: '로그인 성공', userId: user.id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ msg: '서버 오류가 발생했습니다. 다시 시도해주세요.' });
    }
});

const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const uploadMiddleware = multer({ storage: storage }).single('profileImage');

// @route   POST /api/auth/profile/:userId
// @desc    Update user profile with nickname and/or image
// @access  Private
// IMPORTANT: This route uses multer for multipart/form-data, so it does NOT use the jsonParser.
// @route   POST /api/auth/profile/:userId
// @desc    Update user profile with nickname and/or image
// @access  Private
// IMPORTANT: This route uses multer for multipart/form-data, so it does NOT use the jsonParser.
router.post('/profile/:userId', (req, res, next) => {
    uploadMiddleware(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error("Multer error:", err);
            return res.status(500).json({ msg: `파일 업로드 중 오류 발생: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error("Unknown upload error:", err);
            return res.status(500).json({ msg: `알 수 없는 파일 업로드 오류 발생: ${err.message}` });
        }
        // Everything went fine, proceed to the next middleware/route handler
        next();
    });
}, async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { userId } = req.params;
        // The username is now available directly on req.body because Multer parsed it
        const { username } = req.body;
        let profileImageUrl = null;

        if (req.file) {
            profileImageUrl = `/uploads/${req.file.filename}`;
        }

        const updates = [];
        const params = [];

        if (username !== undefined) {
            updates.push('username = ?');
            params.push(username);
        }
        if (profileImageUrl) {
            updates.push('profile_image_url = ?');
            params.push(profileImageUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({ msg: 'No profile data provided to update.' });
        }

        params.push(userId); // for the WHERE clause

        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await connection.query(sql, params);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'User not found, update failed.' });
        }

        const [updatedUsers] = await connection.query(
            'SELECT id, username, email, profile_image_url, weight FROM users WHERE id = ?',
            [userId]
        );
        
        await connection.commit();
        res.json(updatedUsers[0]);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Profile update error:", error);
        res.status(500).json({ msg: `프로필 업데이트 중 서버 오류 발생: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
});

// @route   GET /api/auth/profile/:userId
// @desc    Get user profile
// @access  Private
router.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // FIX: Also select 'weight' here to ensure consistency
        const [users] = await db.query('SELECT id, username, real_name, email, profile_image_url, weight, provider FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ msg: `Database error: ${error.message}` });
    }
});

// @route   PUT /api/auth/profile/:userId
// @desc    Update user profile (general updates via JSON)
// @access  Private
router.put('/profile/:userId', jsonParser, async (req, res) => {
    const { userId } = req.params;
    const { username, weight } = req.body; // Allow both username and weight

    const updates = [];
    const params = [];

    if (username !== undefined) {
        updates.push('username = ?');
        params.push(username);
    }
    if (weight !== undefined) {
        updates.push('weight = ?');
        params.push(weight);
    }

    if (updates.length === 0) {
        return res.status(400).json({ msg: 'No profile data provided to update.' });
    }

    try {
        params.push(userId); // for the WHERE clause
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'User not found, update failed.' });
        }

        const [updatedUsers] = await db.query(
            'SELECT id, username, email, profile_image_url, weight FROM users WHERE id = ?',
            [userId]
        );
        
        res.json(updatedUsers[0]);

    } catch (error) {
        console.error('Update profile (general) error:', error);
        res.status(500).json({ msg: `서버 오류: ${error.message}` });
    }
});

// @route   PUT /api/auth/change-password/:userId
// @desc    Change user password
// @access  Private
router.put('/change-password/:userId', jsonParser, async (req, res) => {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ msg: '모든 필드를 입력해주세요.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: '현재 비밀번호가 일치하지 않습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ msg: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ msg: `Database error: ${error.message}` });
    }
});

// @route   PUT /api/auth/change-email/:userId
// @desc    Change user email (ID)
// @access  Private
router.put('/change-email/:userId', jsonParser, async (req, res) => {
    const { userId } = req.params;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
        return res.status(400).json({ msg: '모든 필드를 입력해주세요.' });
    }

    try {
        const [existingUser] = await db.query('SELECT email FROM users WHERE email = ?', [newEmail]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: '이미 사용중인 이메일입니다.' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: '비밀번호가 일치하지 않습니다.' });
        }

        await db.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);

        res.json({ msg: '이메일(아이디)이 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error('Change email error:', error);
        res.status(500).json({ msg: `Database error: ${error.message}` });
    }
});

// @route   PUT /api/auth/change-username/:userId
// @desc    Change user username (nickname)
// @access  Private
router.put('/change-username/:userId', jsonParser, async (req, res) => {
    const { userId } = req.params;
    const { newUsername, password } = req.body;

    if (!newUsername || !password) {
        return res.status(400).json({ msg: '모든 필드를 입력해주세요.' });
    }

    try {
        // Verify current password
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: '비밀번호가 일치하지 않습니다.' });
        }

        // Update username
        await db.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);

        res.json({ msg: '닉네임이 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error('Change username error:', error);
        res.status(500).json({ msg: `Database error: ${error.message}` });
    }
});

// @route   DELETE /api/auth/withdraw/:userId
// @desc    Delete user account
// @access  Private
router.delete('/withdraw/:userId', async (req, res) => {
    const { userId } = req.params;
    let connection; // Declare connection outside try-catch to ensure it's accessible in finally
    console.log(`Attempting to withdraw user: ${userId}`); // Debug log

    try {
        connection = await db.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        // Delete associated data from other tables first
        console.log(`Deleting associated data for user ${userId}...`); // Debug log
        await connection.query('DELETE FROM menstrual_cycles WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM menstrual_predictions WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM daily_steps WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM todos WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM events WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM diaries WHERE user_id = ?', [userId]); // Corrected table name
        // Delete meal_foods entries associated with meals of this user
        await connection.query('DELETE FROM meal_foods WHERE meal_id IN (SELECT id FROM meals WHERE user_id = ?)', [userId]);
        await connection.query('DELETE FROM meals WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM stopwatch_records WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM stopwatch_categories WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM templates WHERE user_id = ?', [userId]);
        console.log(`Associated data deleted for user ${userId}.`); // Debug log

        // Finally, delete the user from the users table
        console.log(`Deleting user ${userId} from 'users' table...`); // Debug log
        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        console.log(`DELETE FROM users result for user ${userId}:`, result); // Debug log

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback if user not found
            console.log(`User ${userId} not found for withdrawal, rolling back.`); // Debug log
            return res.status(404).json({ msg: '사용자를 찾을 수 없습니다.' });
        }

        await connection.commit(); // Commit the transaction if all successful
        console.log(`User ${userId} successfully withdrawn and transaction committed.`); // Debug log
        res.status(200).json({ msg: '회원 탈퇴가 성공적으로 처리되었습니다.' });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on error
        }
        console.error('Withdraw account error:', error);
        res.status(500).json({ msg: `Database error: ${error.message}` });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});


module.exports = router;