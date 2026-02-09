import React from 'react';
import './SortToggle.css';

const SortToggle = ({ sortOrder, setSortOrder, labelAsc = '낮은 순', labelDesc = '높은 순' }) => {
    return (
        <div className="sort-toggle-container">
            <div className={`sort-switch ${sortOrder === 'desc' ? 'desc' : 'asc'}`}>
                <div className="sort-option" onClick={() => setSortOrder('desc')}>
                    {labelDesc}
                </div>
                <div className="sort-option" onClick={() => setSortOrder('asc')}>
                    {labelAsc}
                </div>
                <div className="sort-slider"></div>
            </div>
        </div>
    );
};

export default SortToggle;