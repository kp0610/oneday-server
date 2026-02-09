const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.use(express.json());

// @route   POST /api/templates
// @desc    Create a new template
// @access  Private
router.post('/', async (req, res) => {
    const { userId, title, type, color } = req.body;

    if (!userId || !title || !type) {
        return res.status(400).json({ msg: 'userId, title, and type are required.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO templates (user_id, title, type, color) VALUES (?, ?, ?, ?)',
            [userId, title, type, color || '#FFE79D'] // Default color if not provided
        );
        res.status(201).json({ msg: 'Template created successfully.', templateId: result.insertId });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

// @route   GET /api/templates/:userId
// @desc    Get templates for a specific user, optionally filtered by type
// @access  Private
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { type } = req.query; // Optional filter by type

    try {
        let query = 'SELECT id, title, type, color FROM templates WHERE user_id = ?';
        let params = [userId];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        const [templates] = await db.query(query, params);
        res.json(templates);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

// @route   DELETE /api/templates/:templateId
// @desc    Delete a template
// @access  Private
router.delete('/:templateId', async (req, res) => {
    const { templateId } = req.params;
    try {
        const [result] = await db.query('DELETE FROM templates WHERE id = ?', [templateId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Template not found.' });
        }
        res.json({ msg: 'Template deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

module.exports = router;
