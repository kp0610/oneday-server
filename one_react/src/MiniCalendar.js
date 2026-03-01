import React, { useState, useEffect } from 'react';
import './MiniCalendar.css';

const MiniCalendar = ({ selectedDates, onDateSelect, currentMonthYear, setCurrentMonthYear = () => {} }) => {

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const renderHeader = () => {
        if (!currentMonthYear || !(currentMonthYear instanceof Date)) {
            // Fallback or loading state if currentMonthYear is not a valid Date object
            return (
                <div className="mini-calendar-header">
                    <button onClick={() => setCurrentMonthYear(new Date())}>&lt;</button>
                    <span>Loading...</span>
                    <button onClick={() => setCurrentMonthYear(new Date())}>&gt;</button>
                </div>
            );
        }
        return (
            <div className="mini-calendar-header">
                <button onClick={() => setCurrentMonthYear(new Date(currentMonthYear.getFullYear(), currentMonthYear.getMonth() - 1))}>&lt;</button>
                <span>{monthNames[currentMonthYear.getMonth()]} {currentMonthYear.getFullYear()}</span>
                <button onClick={() => setCurrentMonthYear(new Date(currentMonthYear.getFullYear(), currentMonthYear.getMonth() + 1))}>&gt;</button>
            </div>
        );
    };

    const renderDays = () => {
        if (!currentMonthYear || !(currentMonthYear instanceof Date)) {
            return []; // Return empty array if currentMonthYear is not valid
        }
        const monthStart = new Date(currentMonthYear.getFullYear(), currentMonthYear.getMonth(), 1);
        const monthEnd = new Date(currentMonthYear.getFullYear(), currentMonthYear.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(monthStart.getDate() - monthStart.getDay()); // Go to Sunday of the first week

        const days = [];
        let day = startDate;
        while (day <= monthEnd || days.length % 7 !== 0) { // Ensure full weeks are rendered
            const dayString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const isCurrentMonth = day.getMonth() === currentMonthYear.getMonth();
            const isSelected = selectedDates.includes(dayString);

            days.push(
                <div
                    key={dayString}
                    className={`mini-day-cell
                                ${isCurrentMonth ? '' : 'other-month'}
                                ${isSelected ? 'selected' : ''}
                                `}
                    onClick={() => onDateSelect(dayString)}
                >
                    {day.getDate()}
                </div>
            );
            day.setDate(day.getDate() + 1);
        }
        return days;
    };

    return (
        <div className="mini-calendar">
            {renderHeader()}
            <div className="mini-calendar-weekdays">
                {weekdays.map(day => <div key={day} className="mini-weekday">{day}</div>)}
            </div>
            <div className="mini-calendar-days">
                {renderDays()}
            </div>
        </div>
    );
};

export default MiniCalendar;