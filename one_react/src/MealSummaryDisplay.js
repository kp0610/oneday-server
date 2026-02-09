import React, { useMemo } from 'react';
import './MealSummaryDisplay.css';

const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Define default recommended calories and calculate macros based on it
const defaultRecommendedCalories = 2000; // Example value, can be made dynamic later
const recommendedCarbs = Math.round(defaultRecommendedCalories * 0.55 / 4);
const recommendedProtein = Math.round(defaultRecommendedCalories * 0.20 / 4);
const recommendedFat = Math.round(defaultRecommendedCalories * 0.25 / 9);

const MealSummaryDisplay = ({ mealsByDate, selectedStartDate, selectedEndDate, sortOrder }) => { // Accept sortOrder

    // New: Calculate daily calorie totals for the selected range
    const dailyCaloriesData = useMemo(() => {
        const datesToProcess = getDatesInRange(selectedStartDate, selectedEndDate);
        const data = [];

        datesToProcess.forEach(date => {
            let totalCalories = 0;
            if (mealsByDate[date]) {
                mealsByDate[date].forEach(mealCard => {
                    mealCard.foods.forEach(food => {
                        totalCalories += (parseFloat(food.calories) || 0) * (food.qty || 1); // Use parseFloat for calories
                    });
                });
            }
            if (totalCalories > 0) {
                data.push({ date: date, totalCalories: totalCalories });
            }
        });
        return data;
    }, [mealsByDate, selectedStartDate, selectedEndDate]);

    // New: Determine the target day (highest/lowest calorie)
    const targetDayData = useMemo(() => {
        if (dailyCaloriesData.length === 0) return null;

        let targetDay = dailyCaloriesData[0];
        dailyCaloriesData.forEach(day => {
            if (sortOrder === 'desc') { // Highest calorie
                if (day.totalCalories > targetDay.totalCalories) {
                    targetDay = day;
                }
            } else { // 'asc' - Lowest calorie
                if (day.totalCalories < targetDay.totalCalories) {
                    targetDay = day;
                }
            }
        });
        return targetDay;
    }, [dailyCaloriesData, sortOrder]);

    // Modified: Get meals only for the target day
    const targetDayMeals = useMemo(() => {
        if (!targetDayData || !mealsByDate[targetDayData.date]) return [];

        const meals = [];
        mealsByDate[targetDayData.date].forEach(mealCard => {
            mealCard.foods.forEach(food => {
                meals.push({
                    name: food.name,
                    qty: food.qty || 1,
                    calories: parseFloat(food.calories) || 0,
                    carbs: parseFloat(food.carbs) || 0,
                    protein: parseFloat(food.protein) || 0,
                    fat: parseFloat(food.fat) || 0,
                });
            });
        });
        return meals;
    }, [targetDayData, mealsByDate]);

    // New: Calculate total macros for the target day
    const targetDayMacros = useMemo(() => {
        const macros = { calories: 0, carbs: 0, protein: 0, fat: 0 };
        targetDayMeals.forEach(meal => {
            macros.calories += meal.calories * meal.qty;
            macros.carbs += meal.carbs * meal.qty;
            macros.protein += meal.protein * meal.qty;
            macros.fat += meal.fat * meal.qty;
        });
        return {
            calories: Math.round(macros.calories),
            carbs: Math.round(macros.carbs),
            protein: Math.round(macros.protein),
            fat: Math.round(macros.fat)
        };
    }, [targetDayMeals]);


    return (
        <div className="meal-summary-container">
            {targetDayMeals.length > 0 ? ( // Display target day meals if available
                <>
                    <div className="meal-chips-list"> {/* Wrapper for meal chips */}
                        {targetDayMeals.map((meal, index) => {
                            const mealName = meal.name || '알 수 없는 메뉴';
                            const mealQty = meal.qty ? `${meal.qty}인분` : '';
                            const mealText = `${mealName} ${mealQty}`.trim();
                            const displayText = mealText.length > 10 ? mealText.substring(0, 10) + '...' : mealText;

                            return (
                                <div key={index} className="meal-item-chip">
                                    {displayText}
                                </div>
                            );
                        })}
                    </div>

                    <div className="macros-box">
                        <div className="macros-summary">
                            <p className="total-calories-label">총 칼로리</p>
                            <p className="total-calories-value">
                                <span className="calorie-number">{targetDayMacros.calories}</span>
                                <span className="calorie-unit">kcal</span>
                            </p>
                        </div>
                        <div className="macro-items-container">
                            <div className="macro-item">
                                <label>탄수화물</label>
                                <div className="macro-bar">
                                    <div
                                        className="macro-bar-progress"
                                        style={{ width: `${Math.min(100, (targetDayMacros.carbs / recommendedCarbs) * 100)}%` }}
                                    ></div>
                                </div>
                                <span>{targetDayMacros.carbs}g</span>
                            </div>
                            <div className="macro-item">
                                <label>단백질</label>
                                <div className="macro-bar">
                                    <div
                                        className="macro-bar-progress"
                                        style={{ width: `${Math.min(100, (targetDayMacros.protein / recommendedProtein) * 100)}%` }}
                                    ></div>
                                </div>
                                <span>{targetDayMacros.protein}g</span>
                            </div>
                            <div className="macro-item">
                                <label>지방</label>
                                <div className="macro-bar">
                                    <div
                                        className="macro-bar-progress"
                                        style={{ width: `${Math.min(100, (targetDayMacros.fat / recommendedFat) * 100)}%` }}
                                    ></div>
                                </div>
                                <span>{targetDayMacros.fat}g</span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="empty-meal-summary">
                    저장된 식단 데이터가 없습니다.
                </div>
            )}
        </div>
    );
};

export default MealSummaryDisplay;