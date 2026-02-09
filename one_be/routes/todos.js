const express = require('express');
const router = express.Router();
router.use(express.json());
const db = require('../config/db');

// @route   GET /api/todos/:userId/:date
// @desc    Get all todos for a user on a specific date
// @access  Private
router.get('/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    try {
        const [todos] = await db.query(
            'SELECT * FROM todos WHERE user_id = ? AND `date` = ?',
            [userId, date]
        );
        res.json(todos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/todos
// @desc    Create a new todo or multiple recurring todos
// @access  Private
router.post('/', async (req, res) => {
    const { userId, title, date, color, selectedDays } = req.body; // Added color

    if (!userId || !title || !date) {
        return res.status(400).json({ msg: 'userId, title, and date are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let newTodos = [];
        if (selectedDays && selectedDays.length > 0) {
            // Create recurring todos for 1 year
            const startDate = new Date(date);
            for (let i = 0; i < 365; i++) {
                const day = new Date(startDate);
                day.setDate(day.getDate() + i);

                if (selectedDays.includes(day.getDay())) {
                    const year = day.getFullYear();
                    const month = (day.getMonth() + 1).toString().padStart(2, '0');
                    const dayOfMonth = day.getDate().toString().padStart(2, '0');
                    const dateString = `${year}-${month}-${dayOfMonth}`;
                    newTodos.push([
                        userId,
                        dateString,
                        title,
                        color || '#fffbe6' // Added color with default
                    ]);
                }
            }
        } else {
            // Create single todo
            newTodos.push([userId, date, title, color || '#fffbe6']); // Added color with default
        }

        if (newTodos.length > 0) {
            const sql = 'INSERT INTO todos (user_id, `date`, title, color) VALUES ?'; // Added color to INSERT
            await connection.query(sql, [newTodos]);
        }

        await connection.commit();
        res.status(201).json({ msg: 'Todo(s) created successfully.' });

    } catch (err) {
        await connection.rollback();
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});

// @route   PUT /api/todos/:todoId/complete
// @desc    Toggle todo completion status
// @access  Private
router.put('/:todoId/complete', async (req, res) => {
    const { todoId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
        return res.status(400).json({ msg: 'Completed status must be a boolean.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE todos SET completed = ? WHERE id = ?',
            [completed, todoId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Todo not found.' });
        }
        res.json({ msg: 'Todo completion status updated.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/todos/:todoId
// @desc    Delete a todo
// @access  Private
router.delete('/:todoId', async (req, res) => {
    const { todoId } = req.params;
    try {
        const [result] = await db.query('DELETE FROM todos WHERE id = ?', [todoId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Todo not found.' });
        }
        res.json({ msg: 'Todo deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
