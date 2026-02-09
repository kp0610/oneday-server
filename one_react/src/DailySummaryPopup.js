import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import './DailySummaryPopup.css';
import { useData } from './DataContext'; // Import useData
import { useProfile } from './ProfileContext'; // Import useProfile

const DailySummaryPopup = ({ show, onClose, date, dailyData }) => { // Removed userId from props
    // Access contexts
    const { dietTotals } = useData();
    const { profile } = useProfile();

    // Calorie Graph Logic (copied from Pedometer.js)
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);
    const [graphProgress, setGraphProgress] = useState(0);
    const graphPathLength = 283;

    useEffect(() => {
        const newGoal = profile.weight ? Math.round(parseFloat(profile.weight) * 25) : 2000;
        setDailyCalorieGoal(newGoal);
    }, [profile.weight]);

    useEffect(() => {
        let progressPercent = (dietTotals.calories / dailyCalorieGoal) * 100;
        progressPercent = Math.min(100, Math.max(0, progressPercent));
        setGraphProgress(progressPercent);
    }, [dietTotals, dailyCalorieGoal]);

    const strokeDashoffset = graphPathLength - (graphPathLength * graphProgress) / 100;

    if (!show) return null;

    // Extract counts from dailyData
    const completedTodosCount = dailyData?.completedTodosCount || 0;
    const totalTodosCount = dailyData?.totalTodosCount || 0;
    const completedEventsCount = dailyData?.completedEventsCount || 0;
    const totalEventsCount = dailyData?.totalEventsCount || 0;

    // Format date to MM/DD
    const formattedDate = date ? date.substring(5, 10).replace('-', '/') : '';

    return (
        <div className="daily-summary-popup">
            <div className="popup-header">
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <h3 style={{ color: '#383838', fontSize: '14px', margin: '0', marginRight: '5px' }}>하루요약</h3>
                    <span style={{ color: '#FFBBC1', fontSize: '12px' }}>{formattedDate}</span>
                </div>
                <button onClick={onClose} className="modal-close-btn">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L9 9M1 9L9 1" stroke="#383838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            <div className="popup-content">
                <div className="summary-chips-wrapper">
                    <div className="summary-chip">
                        <span className="chip-label">일정 완료</span>
                        <span className="chip-data">{completedEventsCount}/{totalEventsCount}</span>
                    </div>
                    <div className="summary-chip">
                        <span className="chip-label">투두 완료</span>
                        <span className="chip-data">{completedTodosCount}/{totalTodosCount}</span>
                    </div>
                </div>
                <div className="health-card">
                    <div className="graph-and-text-wrapper"> {/* New wrapper */}
                        <div className="pedometer-graph-wrapper"> {/* Re-added pedometer-graph-wrapper */}
                            <svg className="pedometer-graph" viewBox="0 0 100 100">
                                <circle className="pedometer-graph-background" cx="50" cy="50" r="45"></circle>
                                <circle
                                    className="pedometer-graph-progress"
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    strokeDasharray={graphPathLength}
                                    strokeDashoffset={strokeDashoffset}
                                ></circle>
                            </svg>
                        </div>
                        <div className="pedometer-graph-text">
                            <p>
                                <span className="calorie-value">{Math.round(dietTotals.calories)}</span>
                                <br />
                                / {dailyCalorieGoal}
                            </p>
                        </div>
                    </div>
                    <p className="health-card-label">섭취칼로리</p>
                </div>
            </div>
        </div>
    );
};

export default DailySummaryPopup;