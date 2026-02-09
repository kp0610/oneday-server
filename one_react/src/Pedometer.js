import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { useProfile } from './ProfileContext';
import './Pedometer.css';

const Pedometer = ({ userId }) => {
    // --- Get Data From Contexts ---
    const { steps, updateSteps, dietTotals } = useData();
    const { profile, loading: profileLoading, updateWeight } = useProfile();
    
    // --- Local UI State ---
    const [isEditingWeight, setIsEditingWeight] = useState(false);
    // Local state to manage the input field value during editing
    const [weightInput, setWeightInput] = useState('');
    
    // --- Local Derived State ---
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);
    const [kcalRemaining, setKcalRemaining] = useState(0);
    const [graphProgress, setGraphProgress] = useState(0);
    const graphPathLength = 283;
    const strokeDashoffset = graphPathLength - (graphPathLength * graphProgress) / 100;

    // Sync local input with context profile weight when not editing
    useEffect(() => {
        if (profile.weight !== null) {
            setWeightInput(String(profile.weight));
        } else {
            setWeightInput('');
        }
    }, [profile.weight]);

    // --- Update Calorie Goal based on weight ---
    useEffect(() => {
        const newGoal = profile.weight ? Math.round(parseFloat(profile.weight) * 25) : 2000;
        setDailyCalorieGoal(newGoal);
    }, [profile.weight]);

    // --- Save Weight (using context) ---
    const handleSaveWeight = async () => {
        if (!weightInput || isNaN(weightInput) || parseFloat(weightInput) <= 0) {
            alert('유효한 체중을 입력해주세요.');
            // Reset to original weight on invalid input
            setWeightInput(profile.weight ? String(profile.weight) : '');
            setIsEditingWeight(false);
            return;
        }
        try {
            await updateWeight(weightInput);
            // alert("체중이 성공적으로 업데이트되었습니다."); // Optional: remove alert for seamless experience
            setIsEditingWeight(false); // Exit editing mode on successful save
        } catch (error) {
            console.error(error);
            alert(error.message || "체중 업데이트에 실패했습니다.");
            setIsEditingWeight(false); // Also exit editing mode on failure
        }
    };
    
    const handleWeightInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Trigger onBlur to save
        }
    };

    // --- Graph Calculation ---
    useEffect(() => {
        // Calculate progress based on consumed calories vs daily calorie goal
        let progressPercent = (dietTotals.calories / dailyCalorieGoal) * 100;
        // Ensure progressPercent does not exceed 100% or go below 0%
        progressPercent = Math.min(100, Math.max(0, progressPercent));
        setGraphProgress(progressPercent);

        // kcalRemaining is no longer relevant for the graph's center text as per user's request
        // However, the component still uses it in other places, so let's keep a placeholder or re-evaluate its use.
        // For now, I'll set it to 0 as it's not being displayed in the graph center.
        setKcalRemaining(0); // This was previously displayed in the center, now replaced by consumed/target calories.
    }, [dietTotals, dailyCalorieGoal]); // Dependencies changed as steps are no longer directly used for this graph progress

    return (
        <div className="pedometer-wrapper">

            <div className="healthcare-content-box">
                <div className="pedometer-info-wrapper">
                    <div className="pedometer-column weight-column">
                        <div className="weight-info">
                            {profileLoading ? (
                                <p>로딩 중...</p>
                            ) : (
                                <div className="weight-display-container" onClick={() => !isEditingWeight && setIsEditingWeight(true)}>
                                    <span className="weight-scale-icon">
                                        <svg width="41" height="41" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <rect x="4" y="6" width="16" height="14" rx="1.5" stroke="#4F5355" strokeWidth="2"/>
                                          <rect x="8" y="10" width="8" height="4" rx="0.5" fill="#4F5355"/>
                                        </svg>
                                    </span>
                                    <div className="weight-value-container">
                                        {isEditingWeight ? (
                                            <input
                                                className="weight-input-inplace"
                                                type="number"
                                                step="0.1"
                                                value={weightInput}
                                                onChange={(e) => setWeightInput(e.target.value)}
                                                onBlur={handleSaveWeight}
                                                onKeyDown={handleWeightInputKeyDown}
                                                autoFocus
                                            />
                                        ) : (
                                            <p>{profile.weight || '입력'}</p>
                                        )}
                                        <span className="weight-unit">kg</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                <div className="pedometer-graph-wrapper">
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
                    <div className="pedometer-graph-text">
                        <p><span className="calorie-value">{Math.round(dietTotals.calories)}</span> / {dailyCalorieGoal} <br /> kcal</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pedometer;
