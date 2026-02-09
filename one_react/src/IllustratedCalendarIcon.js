import React from 'react';
import './IllustratedCalendarIcon.css';

const IllustratedCalendarIcon = ({ onClick }) => {
    const day = new Date().getDate();

    return (
        <div className="illustrated-calendar-icon" onClick={onClick}>
            <div className="calendar-top-bar"></div>
            <div className="calendar-body">
                <span className="calendar-day">{day}</span>
            </div>
        </div>
    );
};

export default IllustratedCalendarIcon;
