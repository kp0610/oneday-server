const express = require('express');
const router = express.Router();
router.use(express.json({ limit: '50mb' })); // Apply JSON parser to this router
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// @route   GET /api/diaries/:userId
// @desc    Get all diary entries for a specific user
// @access  Private
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [diaries] = await db.query(
            'SELECT * FROM diaries WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );

        const processedDiaries = diaries.map(diary => {
            try {
                if (typeof diary.texts === 'string') {
                    diary.texts = JSON.parse(diary.texts);
                }
                if (typeof diary.images === 'string') {
                    diary.images = JSON.parse(diary.images);
                }
            } catch (e) {
                console.error("Error parsing diary data from DB:", e);
                diary.texts = diary.texts || [];
                diary.images = diary.images || [];
            }
            return diary;
        });

        res.json(processedDiaries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/diaries/admin/cleanup-missing-images
// @desc    (Admin) Finds diary entries with missing image files and nullifies their paths.
// @access  Public (for ease of use by user)
router.get('/admin/cleanup-missing-images', async (req, res) => {
    try {
        console.log('[HEAL] Starting cleanup of missing diary images...');
        const [diaries] = await db.query('SELECT id, canvasImagePath FROM diaries WHERE canvasImagePath IS NOT NULL AND canvasImagePath != ""');
        
        const missingFileIds = [];
        let checkedCount = 0;

        for (const diary of diaries) {
            checkedCount++;
            const imagePath = path.join(__dirname, '..', diary.canvasImagePath);
            if (!fs.existsSync(imagePath)) {
                missingFileIds.push(diary.id);
                console.log(`[HEAL] Marked diary ID ${diary.id} for cleanup. Missing file: ${imagePath}`);
            }
        }

        if (missingFileIds.length > 0) {
            const [updateResult] = await db.query('UPDATE diaries SET canvasImagePath = NULL WHERE id IN (?)', [missingFileIds]);
            console.log(`[HEAL] Successfully cleaned up ${updateResult.affectedRows} entries.`);
            res.status(200).send(`<h1>데이터베이스 정리 완료!</h1><p>${updateResult.affectedRows}개의 다이어리에서 존재하지 않는 이미지 경로를 삭제했습니다. 이제 페이지를 닫고 앱으로 돌아가세요.</p>`);
        } else {
            console.log('[HEAL] No missing image files found.');
            res.status(200).send('<h1>데이터베이스 정리 완료!</h1><p>손상된 데이터를 찾지 못했습니다. 모든 다이어리가 정상입니다.</p>');
        }

    } catch (err) {
        console.error('[HEAL] An error occurred during cleanup:', err);
        res.status(500).send('<h1>오류 발생!</h1><p>데이터베이스 정리 중 오류가 발생했습니다. 서버 로그를 확인해주세요.</p>');
    }
});

// @route   GET /api/diaries/id/:id
// @desc    Get diary entry by its primary key ID
// @access  Private
router.get('/id/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [diaries] = await db.query('SELECT * FROM diaries WHERE id = ?', [id]);
        if (diaries.length > 0) {
            const diary = diaries[0];
            // JSON parsing
            if (typeof diary.texts === 'string') diary.texts = JSON.parse(diary.texts || '[]');
            if (typeof diary.images === 'string') diary.images = JSON.parse(diary.images || '[]');
            res.json(diary);
        } else {
            res.status(404).json({ msg: 'Diary not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/diaries/:userId/:date
// @desc    Get diary entry for a specific user and date
// @access  Private
router.get('/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;

    try {
        const [diaries] = await db.query(
            'SELECT * FROM diaries WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        if (diaries.length > 0) {
            const diary = diaries[0];
            if (typeof diary.texts === 'string') {
                try {
                    diary.texts = JSON.parse(diary.texts);
                } catch (e) {
                    console.error("Error parsing texts from DB:", e);
                    diary.texts = [];
                }
            }
            if (typeof diary.images === 'string') {
                try {
                    diary.images = JSON.parse(diary.images);
                } catch (e) {
                    console.error("Error parsing images from DB:", e);
                    diary.images = [];
                }
            }
            res.json(diary);
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/diaries
// @desc    Create or update a diary entry (upsert)
// @access  Private
router.post('/', async (req, res) => {
    const { userId, date, title, canvasData, texts, images } = req.body;

    if (!userId || !date) {
        return res.status(400).json({ msg: 'User ID and date are required.' });
    }

    let oldImagePath = '';
    try {
        const [existingDiary] = await db.query('SELECT canvasImagePath FROM diaries WHERE user_id = ? AND date = ?', [userId, date]);
        if (existingDiary.length > 0) {
            oldImagePath = existingDiary[0].canvasImagePath;
        }
    } catch (err) {
        console.error("Error fetching existing diary:", err);
    }

    let canvasImagePath = oldImagePath;
    if (canvasData) {
        try {
            const base64Data = canvasData.replace(/^data:image\/png;base64,/, "");
            const fileName = `${Date.now()}_${userId}.png`;
            const filePath = path.join(__dirname, '..', 'uploads', fileName);
            fs.writeFileSync(filePath, base64Data, 'base64');
            canvasImagePath = `/uploads/${fileName}`;
        } catch (err) {
            console.error("Error saving canvas image:", err);
            return res.status(500).send('Error saving canvas image.');
        }
    } else {
        canvasImagePath = ''; // Ensure canvasImagePath is empty if no canvasData
    }

    try {
        const sql = `
            INSERT INTO diaries (user_id, date, title, canvasImagePath, texts, images)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            canvasImagePath = VALUES(canvasImagePath),
            texts = VALUES(texts),
            images = VALUES(images)
        `;
        const params = [userId, date, title, canvasImagePath, JSON.stringify(texts || []), JSON.stringify(images || [])];
        const [result] = await db.query(sql, params);

        if (oldImagePath && oldImagePath !== canvasImagePath) {
            const oldFilePath = path.join(__dirname, '..', oldImagePath);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (unlinkErr) {
                    console.error("Error deleting old image:", unlinkErr);
                }
            }
        }

        res.status(201).json({ msg: 'Diary saved.', insertId: result.insertId });
    } catch (err) {
        console.error(err.message);
        fs.writeFileSync(path.join(__dirname, '..', 'db_error.log'), JSON.stringify(err, null, 2));
        res.status(500).send('Server Error');
    }
});

module.exports = router;
