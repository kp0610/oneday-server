import React, { useState } from 'react';
import './DateFilter.css';

const DateFilter = ({ onApply, onCancel }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleApply = () => {
        onApply({ startDate, endDate });
    };

    return (
        <div className="date-filter-overlay">
            <div className="date-filter-panel">
                <h2>기간 설정</h2>
                <div className="date-inputs">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                    <span>~</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>
                <div className="filter-buttons">
                    <button onClick={onCancel}>취소</button>
                    <button onClick={handleApply}>적용</button>
                </div>
            </div>
        </div>
    );
};

export default DateFilter;
