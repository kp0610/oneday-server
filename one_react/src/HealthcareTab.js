import React, { useState } from 'react';
import CyclePrediction from './CyclePrediction';
import Pedometer from './Pedometer';
import Diet from './Diet';
import { useData } from './DataContext';
import './HealthcareTab.css'; // Import the new CSS file
import './HomeTab.css';

const HealthcareTab = ({ userId }) => {
    const { dietTotals } = useData();
    const [selectedCycleStartDate, setSelectedCycleStartDate] = useState(null); 

    const defaultRecommendedCalories = 2000;
    const recommendedCarbs = Math.round(defaultRecommendedCalories * 0.55 / 4);
    const recommendedProtein = Math.round(defaultRecommendedCalories * 0.20 / 4);
    const recommendedFat = Math.round(defaultRecommendedCalories * 0.25 / 9);

    return (
        <div id="healthcare-tab" className="healthcare-tab-content dash-tab-content active">
            <div className="combined-content-box">
                <div className="healthcare-row">
                    <div className="dashboard-section cycle-prediction-section">
                        <CyclePrediction userId={userId} selectedCycleStartDate={selectedCycleStartDate} />
                    </div>
                    <div className="dashboard-section calorie-intake-section">
                        <h3 className="macro-title">섭취 칼로리</h3>
                        <Pedometer userId={userId} />
                    </div>
                    <div className="dashboard-section diet-section"> {/* Added diet-section class for specific styling */}
                        <Diet />
                    </div>
                </div>
                <div className="dashboard-section macros-section">
                    <h3>탄단지 계산</h3>
                    <div className="macros-box">
                        <div className="macros-summary">
                            <p className="total-calories-label">총칼로리</p>
                            <p className="total-calories-value">
                                <span className="calorie-number">{Math.round(dietTotals.calories)}</span>
                                <span className="calorie-unit">kcal</span>
                            </p>
                        </div>
                        {/* New divider element */}
                        <div className="macro-divider"></div>
                        <div className="macro-bars-container">
                            <div className="macro-item">
                                <label>탄수화물</label>
                                <div className="macro-bar">
                                    <div 
                                        id="carb-bar" 
                                        className="macro-bar-progress" 
                                        style={{ width: `${Math.min(100, (dietTotals.carbs / recommendedCarbs) * 100)}%` }}
                                    ></div>
                                </div>
                                <span id="carb-amount">{Math.round(dietTotals.carbs)}g</span>
                            </div>
                            <div className="macro-item">
                                <label>단백질</label>
                                <div className="macro-bar">
                                    <div 
                                        id="protein-bar" 
                                        className="macro-bar-progress"
                                        style={{ width: `${Math.min(100, (dietTotals.protein / recommendedProtein) * 100)}%` }}
                                    ></div>
                                </div>
                                <span id="protein-amount">{Math.round(dietTotals.protein)}g</span>
                            </div>
                            <div className="macro-item">
                                <label>지방</label>
                                <div className="macro-bar">
                                    <div 
                                        id="fat-bar" 
                                        className="macro-bar-progress"
                                        style={{ width: `${Math.min(100, (dietTotals.fat / recommendedFat) * 100)}%` }}
                                    ></div>
                                </div>
                                <span id="fat-amount">{Math.round(dietTotals.fat)}g</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthcareTab;