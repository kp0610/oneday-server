import React, { useState } from 'react';
import Diary from './Diary';
import Stopwatch from './Stopwatch';
import './HomeTab.css';

const RecordsTab = ({ userId, selectedDate }) => {
    const [activeRecordTab, setActiveRecordTab] = useState('diary-content');

    return (
        <div id="records-tab" className="dash-tab-content active">
            <div className="combined-content-box">
                <div className="record-menu">
                    <button 
                        className={`record-menu-btn ${activeRecordTab === 'diary-content' ? 'active' : ''}`} 
                        onClick={() => setActiveRecordTab('diary-content')}
                    >
                        다이어리
                    </button>
                    <button 
                        className={`record-menu-btn ${activeRecordTab === 'stopwatch-content' ? 'active' : ''}`} 
                        onClick={() => setActiveRecordTab('stopwatch-content')}
                    >
                        스톱워치
                    </button>
                </div>

                {activeRecordTab === 'diary-content' && <Diary userId={userId} selectedDate={selectedDate} />}
                {activeRecordTab === 'stopwatch-content' && <Stopwatch userId={userId} selectedDate={selectedDate} />}
            </div>
        </div>
    );
};

export default RecordsTab;
