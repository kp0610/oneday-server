const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Use db.js for consistency

// Create a JSON parsing middleware that will be used for specific routes
const jsonParser = express.json();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', jsonParser, async (req, res) => {
    const { email, password, nickname } = req.body;
    // console.log('Backend Register - req.body:', req.body); // Debug log

    if (!email || !password || !nickname) {
        return res.status(400).json({ msg: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' });
    }

    try {
        // Check for existing user
        const [existingUser] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ msg: '이미 사용중인 이메일입니다.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            email,
            password: hashedPassword,
            username: nickname, // Assuming 'username' is the column for nickname
        };
        // console.log('Backend Register - newUser object:', newUser); // Debug log

        const [result] = await db.query('INSERT INTO users SET ?', newUser);
        // console.log('Backend Register - INSERT query result:', result); // Debug log

        res.status(201).json({
            msg: '회원가입이 완료되었습니다.',
            userId: result.insertId
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Server error: ${err.message}` });
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
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ msg: '이메일 또는 비밀번호가 잘못되었습니다.' });
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