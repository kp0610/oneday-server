import React from 'react'; // Removed useState
import './ViewToggle.css';

const ViewToggle = ({ isMonthView, setIsMonthView }) => { // Accept props
    return (
        <div className="view-toggle-container">
            <div className={`toggle-switch ${isMonthView ? 'month' : 'week'}`}>
                <div className="toggle-option" onClick={() => setIsMonthView(true)}>
                    Month
                </div>
                <div className="toggle-option" onClick={() => setIsMonthView(false)}>
                    Week
                </div>
                <div className="toggle-slider"></div>
            </div>
        </div>
    );
};

export default ViewToggle;
