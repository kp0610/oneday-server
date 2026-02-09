const express = require('express');
const router = express.Router();
router.use(express.json());
const pool = require('../config/db'); // Corrected to use pool

// Helper function to get the current date string in KST
const getKSTDateString = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(utc + kstOffset);
    return kstNow.toISOString().split('T')[0];
};

// @route   GET /api/healthcare/cycles/:userId
// @desc    Get all menstrual cycles for a user and predict the next one
// @access  Private
router.get('/cycles/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [cycles] = await pool.query(
            'SELECT id, start_date, end_date FROM menstrual_cycles WHERE user_id = ? ORDER BY start_date DESC',
            [userId]
        );

        let prediction = null;
        let message = '';
        const todayString = req.query.relativeDate || getKSTDateString();
        const today = new Date(todayString);


        // Try to fetch a saved prediction first
        const [savedPredictions] = await pool.query(
            'SELECT predicted_start_date, predicted_end_date FROM menstrual_predictions WHERE user_id = ?',
            [userId]
        );

        if (savedPredictions.length > 0) {
            const saved = savedPredictions[0];
            const today = req.query.relativeDate ? new Date(req.query.relativeDate) : new Date();
            const predictedStartDate = new Date(saved.predicted_start_date);

            const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const predictedStartUTC = Date.UTC(predictedStartDate.getUTCFullYear(), predictedStartDate.getUTCMonth(), predictedStartDate.getUTCDate());

            const dDay = Math.floor((predictedStartUTC - todayUTC) / (1000 * 60 * 60 * 24));

            prediction = {
                startDate: saved.predicted_start_date.toISOString().split('T')[0],
                endDate: saved.predicted_end_date.toISOString().split('T')[0],
                dDay: dDay
            };
            message = '저장된 예측 정보입니다.';
        } else if (cycles.length >= 2) {
            // --- Prediction Logic ---
            let cycleLengths = [];
            for (let i = 0; i < cycles.length - 1; i++) {
                const startDate1 = new Date(cycles[i].start_date);
                const startDate2 = new Date(cycles[i+1].start_date);
                const diffTime = Math.abs(startDate1 - startDate2);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                cycleLengths.push(diffDays);
            }
            const avgCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;

            let durations = [];
            for (let cycle of cycles) {
                const startDate = new Date(cycle.start_date);
                const endDate = new Date(cycle.end_date);
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
                durations.push(diffDays);
            }
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

            const lastStartDate = new Date(cycles[0].start_date);
            const predictedStartDate = new Date(new Date(lastStartDate).setDate(lastStartDate.getDate() + Math.round(avgCycleLength)));
            const predictedEndDate = new Date(new Date(predictedStartDate).setDate(predictedStartDate.getDate() + Math.round(avgDuration - 1)));
            
            const today = req.query.relativeDate ? new Date(req.query.relativeDate) : new Date();
            const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const predictedStartUTC = Date.UTC(predictedStartDate.getFullYear(), predictedStartDate.getMonth(), predictedStartDate.getDate());

            const dDay = Math.floor((predictedStartUTC - todayUTC) / (1000 * 60 * 60 * 24));

            prediction = {
                startDate: predictedStartDate.toISOString().split('T')[0],
                endDate: predictedEndDate.toISOString().split('T')[0],
                dDay: dDay
            };

        } else {
            message = '예측을 위해 최소 2번의 주기 기록이 필요합니다.';
        }

        res.json({
            prediction: prediction,
            history: cycles,
            message: message
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/healthcare/predictions
// @desc    Save or update a menstrual cycle prediction for a user
// @access  Private
router.post('/predictions', async (req, res) => {
    const { userId, predictedStartDate, predictedEndDate } = req.body;

    if (!userId || !predictedStartDate || !predictedEndDate) {
        return res.status(400).json({ msg: '사용자 ID, 예측 시작일, 예측 종료일은 필수입니다.' });
    }

    try {
        const sql = `
            INSERT INTO menstrual_predictions (user_id, predicted_start_date, predicted_end_date)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                predicted_start_date = VALUES(predicted_start_date),
                predicted_end_date = VALUES(predicted_end_date),
                updated_at = CURRENT_TIMESTAMP;
        `;
        await pool.query(sql, [userId, predictedStartDate, predictedEndDate]);
        res.status(201).json({ msg: '예측 정보가 저장되었습니다.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/healthcare/cycles
// @desc    Add a menstrual cycle record
// @access  Private
router.post('/cycles', async (req, res) => {
    const { startDate, endDate, userId } = req.body;

    if (!startDate || !endDate || !userId) {
        return res.status(400).json({ msg: '사용자 ID, 시작일, 종료일을 모두 입력해주세요.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO menstrual_cycles (user_id, start_date, end_date) VALUES (?, ?, ?)',
            [userId, startDate, endDate]
        );
        res.status(201).json({ msg: '주기 기록이 저장되었습니다.', insertId: result.insertId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/healthcare/cycles/:cycleId
// @desc    Delete a menstrual cycle record
// @access  Private
router.delete('/cycles/:cycleId', async (req, res) => {
    const { cycleId } = req.params;

    try {
        const [result] = await pool.query(
            'DELETE FROM menstrual_cycles WHERE id = ?',
            [cycleId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: '주기 기록을 찾을 수 없습니다.' });
        }

        res.status(200).json({ msg: '주기 기록이 삭제되었습니다.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/healthcare/steps/:userId/:date
// @desc    Get steps for a specific user and date
// @access  Private
router.get('/steps/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT steps FROM daily_steps WHERE user_id = ? AND date = ?',
            [userId, date]
        );
        if (rows.length > 0) {
            res.json({ steps: rows[0].steps });
        } else {
            res.json({ steps: 0 }); // If no record, return 0 steps
        }
    } catch (err) {
        console.error('Get steps error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/healthcare/pedometer
// @desc    Save/update pedometer data (steps and weight) for a user and date
// @access  Private
router.post('/pedometer', async (req, res) => {
    const { userId, date, steps, weight } = req.body;
    if (userId === undefined || date === undefined || steps === undefined || weight === undefined) {
        return res.status(400).json({ msg: 'userId, date, steps, and weight are required.' });
    }

    try {
        const sql = `
            INSERT INTO daily_steps (user_id, \`date\`, steps, weight)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE steps = VALUES(steps), weight = VALUES(weight);
        `;
        await pool.query(sql, [userId, date, steps, weight]);
        res.status(200).json({ msg: 'Pedometer data saved successfully.' });
    } catch (err) {
        console.error('Save pedometer data error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/healthcare/weekly_summary/:userId/:endDate
// @desc    Get weekly health summary (steps, calories) for a user
// @access  Private
router.get('/weekly_summary/:userId/:endDate', async (req, res) => {
    const { userId, endDate } = req.params;
    const end = new Date(endDate);
    const start = new Date(endDate);
    start.setDate(end.getDate() - 6); // 7 days including the end date

    const startDate = start.toISOString().split('T')[0];
    const queryEndDate = end.toISOString().split('T')[0];

    try {
        const sql = `
            SELECT 
                ds.date,
                IFNULL(ds.steps, 0) as steps,
                IFNULL(SUM(mf.calories * mf.quantity), 0) as totalConsumedCalories
            FROM
                (SELECT DISTINCT date FROM daily_steps WHERE user_id = ? AND date BETWEEN ? AND ?) ds_dates
            LEFT JOIN daily_steps ds ON ds_dates.date = ds.date AND ds.user_id = ?
            LEFT JOIN meals m ON ds_dates.date = m.date AND m.user_id = ?
            LEFT JOIN meal_foods mf ON m.id = mf.meal_id
            WHERE ds_dates.date BETWEEN ? AND ?
            GROUP BY ds_dates.date
            ORDER BY ds_dates.date;
        `;
        // Need to combine with dates that might not have steps but have meals
        const combinedSql = `
            SELECT
                dates.date,
                IFNULL(ds.steps, 0) as steps,
                IFNULL(SUM(mf.calories * mf.quantity), 0) as totalConsumedCalories
            FROM
                (SELECT DISTINCT date AS date FROM daily_steps WHERE user_id = ? AND date BETWEEN ? AND ?
                 UNION
                 SELECT DISTINCT date AS date FROM meals WHERE user_id = ? AND date BETWEEN ? AND ?
                ) AS dates
            LEFT JOIN daily_steps ds ON dates.date = ds.date AND ds.user_id = ?
            LEFT JOIN meals m ON dates.date = m.date AND m.user_id = ?
            LEFT JOIN meal_foods mf ON m.id = mf.meal_id
            GROUP BY dates.date
            ORDER BY dates.date;
        `;

        const [rows] = await pool.query(combinedSql, [
            userId, startDate, queryEndDate, // for daily_steps dates
            userId, startDate, queryEndDate, // for meals dates
            userId, userId
        ]);

        const weeklySummary = rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            steps: row.steps,
            caloriesBurned: Math.round(row.steps * 0.04), // 1 step = 0.04 kcal
            totalConsumedCalories: Math.round(row.totalConsumedCalories)
        }));

        res.json(weeklySummary);

    } catch (err) {
        console.error('Get weekly summary error:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;