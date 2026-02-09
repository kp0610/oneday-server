import React, { useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom'; // Removed as back button is removed
import { useData } from './DataContext';
import './HealthcareCollection.css';

// import IllustratedCalendarIcon from './IllustratedCalendarIcon'; // Removed as calendar icon is removed

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

const getLastSevenDays = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates.reverse();
};

const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}`;
};

const HealthcareCollection = ({ sortOrder, setSortOrder, selectedStartDate, selectedEndDate }) => {
    // const navigate = useNavigate(); // Removed
    const { mealsByDate, pedometerDataByDate } = useData();



    const processedData = useMemo(() => {
        // Ensure dates are correctly formatted as YYYY-MM-DD for comparison
        const start = selectedStartDate;
        const end = selectedEndDate;

        const datesToProcess = getDatesInRange(start, end);

        const dataPerDay = datesToProcess.map(date => {
            const weight = pedometerDataByDate[date]?.weight || 0;
            const mealCards = mealsByDate[date] || [];

            const macros = { calories: 0, carbs: 0, protein: 0, fat: 0 };
            mealCards.forEach(card => {
                card.foods.forEach(food => {
                    macros.calories += (food.calories || 0) * (food.qty || 1);
                    macros.carbs += (food.carbs || 0) * (food.qty || 1);
                    macros.protein += (food.protein || 0) * (food.qty || 1);
                    macros.fat += (food.fat || 0) * (food.qty || 1);
                });
            });

            return {
                date: date,
                weight: weight,
                totalConsumedCalories: Math.round(macros.calories),
                carbs: Math.round(macros.carbs),
                protein: Math.round(macros.protein),
                fat: Math.round(macros.fat)
            };
        });

        // Filter out days that have no relevant data
        return dataPerDay.filter(day => {
            return day.weight > 0 || day.totalConsumedCalories > 0 || day.carbs > 0 || day.protein > 0 || day.fat > 0;
        });

    }, [mealsByDate, pedometerDataByDate, selectedStartDate, selectedEndDate]);

    const sortedData = useMemo(() => {
        return [...processedData].sort((a, b) => {
            return sortOrder === 'desc' 
                ? b.totalConsumedCalories - a.totalConsumedCalories 
                : a.totalConsumedCalories - b.totalConsumedCalories;
        });
    }, [processedData, sortOrder]);



    return (
        <div className="healthcare-container">

            {/* Removed header and back button and title */}
            {/* Removed hc-header-right filters, only keep sort order if needed within the collection content */}

            


            {sortedData.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className="empty-data-card">
                        저장된 헬스케어 데이터가 없습니다.
                    </div>
                </div>
            ) : (
                <div className="weekly-summary-grid">
                    {sortedData.map(day => (
                        <div key={day.date} className="healthcare-daily-card">
                            <span className="card-date-display">{formatDate(day.date)}</span>
                            <div className="calories-section">
                                <span className="calories-label">총 섭취 칼로리</span>
                                <div className="calories-value-unit">
                                    <span className="calories-value">{day.totalConsumedCalories}</span>
                                    <span className="calories-unit">kcal</span>
                                </div>
                            </div>
                            <div className="weight-section">
                                <span className="weight-label">체중</span>
                                <div className="weight-value-unit">
                                    <span className="weight-value">{day.weight}</span>
                                    <span className="weight-unit">kg</span>
                                </div>
                            </div>
                            <div className="macros-section">
                                <div className="macro-item">
                                    <span className="macro-label">탄수화물</span>
                                    <span className="macro-value">{day.carbs}g</span>
                                </div>
                                <div className="macro-item">
                                    <span className="macro-label">단백질</span>
                                    <span className="macro-value">{day.protein}g</span>
                                </div>
                                <div className="macro-item">
                                    <span className="macro-label">지방</span>
                                    <span className="macro-value">{day.fat}g</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HealthcareCollection;