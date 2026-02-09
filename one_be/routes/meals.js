const express = require('express');
const router = express.Router();
router.use(express.json());
const db = require('../config/db');

// Helper function to insert/update meal foods
async function upsertMealFoods(mealId, foods) {
    if (!foods || foods.length === 0) {
        await db.query('DELETE FROM meal_foods WHERE meal_id = ?', [mealId]);
        return;
    }

    // Get existing food_ids for this meal to identify deletions
    const [existingFoods] = await db.query('SELECT food_name FROM meal_foods WHERE meal_id = ?', [mealId]);
    const existingFoodNames = new Set(existingFoods.map(f => f.food_name));

    const foodsToInsert = [];
    const foodsToUpdate = [];
    const foodsToDelete = new Set(existingFoodNames);

    for (const food of foods) {
        if (existingFoodNames.has(food.name)) {
            foodsToUpdate.push(food);
            foodsToDelete.delete(food.name); // This food is still present, don't delete
        } else {
            foodsToInsert.push(food);
        }
    }

    // Delete removed foods
    if (foodsToDelete.size > 0) {
        const deleteSql = 'DELETE FROM meal_foods WHERE meal_id = ? AND food_name IN (?)';
        await db.query(deleteSql, [mealId, Array.from(foodsToDelete)]);
    }

    // Insert new foods
    if (foodsToInsert.length > 0) {
        const insertSql = `
            INSERT INTO meal_foods (meal_id, food_name, calories, carbs, protein, fat, quantity)
            VALUES ?
        `;
        const insertValues = foodsToInsert.map(food => [
            mealId, food.name, food.calories, food.carbs, food.protein, food.fat, food.qty
        ]);
        await db.query(insertSql, [insertValues]);
    }

    // Update existing foods
    for (const food of foodsToUpdate) {
        const updateSql = `
            UPDATE meal_foods
            SET calories = ?, carbs = ?, protein = ?, fat = ?, quantity = ?
            WHERE meal_id = ? AND food_name = ?
        `;
        await db.query(updateSql, [food.calories, food.carbs, food.protein, food.fat, food.qty, mealId, food.name]);
    }
}


// @route   GET /api/meals/:userId/:date
// @desc    Get meal entries for a specific user and date
// @access  Private
router.get('/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;

    try {
        const [meals] = await db.query(
            'SELECT id, category FROM meals WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        if (meals.length === 0) {
            return res.json([]);
        }

        const mealCards = [];
        for (const meal of meals) {
            const [foods] = await db.query(
                'SELECT food_name as name, calories, carbs, protein, fat, quantity as qty FROM meal_foods WHERE meal_id = ?',
                [meal.id]
            );
            mealCards.push({
                id: meal.id,
                category: meal.category,
                foods: foods,
                searchQuery: '', // Frontend state, not stored in DB
                searchResults: [] // Frontend state, not stored in DB
            });
        }
        res.json(mealCards);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/meals
// @desc    Save (create/update) meal entries for a user on a specific date
// @access  Private
router.post('/', async (req, res) => {
    const { userId, date, mealCards } = req.body;

    if (!userId || !date || !mealCards) {
        return res.status(400).json({ msg: 'User ID, date, and mealCards are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Delete existing meals and meal_foods for this user and date
        const [existingMealIds] = await connection.query('SELECT id FROM meals WHERE user_id = ? AND date = ?', [userId, date]);
        if (existingMealIds.length > 0) {
            const idsToDelete = existingMealIds.map(meal => meal.id);
            await connection.query('DELETE FROM meal_foods WHERE meal_id IN (?)', [idsToDelete]);
            await connection.query('DELETE FROM meals WHERE id IN (?)', [idsToDelete]);
        }
        
        // 2. Insert new meals and their associated foods
        for (const card of mealCards) {
            const [mealResult] = await connection.query(
                'INSERT INTO meals (user_id, `date`, category) VALUES (?, ?, ?)',
                [userId, date, card.category]
            );
            const mealId = mealResult.insertId;
            
            if (card.foods && card.foods.length > 0) {
                const foodValues = card.foods.map(food => [
                    mealId, food.name, food.calories, food.carbs, food.protein, food.fat, food.qty
                ]);
                await connection.query(
                    'INSERT INTO meal_foods (meal_id, food_name, calories, carbs, protein, fat, quantity) VALUES ?',
                    [foodValues]
                );
            }
        }

        await connection.commit();
        res.status(200).json({ msg: 'Meals saved successfully.' });

    } catch (err) {
        await connection.rollback();
        console.error('Error saving meals:', err.message);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});

// @route   GET /api/meals/today_calories/:userId/:date
// @desc    Get total calories for a specific user and date
// @access  Private
router.get('/today_calories/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;

    try {
        const sql = `
            SELECT SUM(mf.calories) as totalCalories
            FROM meals m
            JOIN meal_foods mf ON m.id = mf.meal_id
            WHERE m.user_id = ? AND m.date = ?
        `;
        const [result] = await db.query(sql, [userId, date]);
        
        // If result[0].totalCalories is null (no meals), return 0
        const totalCalories = result[0].totalCalories || 0;
        
        res.json({ totalCalories: parseFloat(totalCalories) });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
