import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import HomeTab from './HomeTab';
import RecordsTab from './RecordsTab';
import HealthcareTab from './HealthcareTab';
import Modal from './Modal'; // Import Modal

const Dashboard = ({
    userId,
    selectedDate,
    dayEvents,
    monthEvents,
    todos,
    onDataUpdate, // Receive the refetch function
    // New props for event modal from drag selection
    showEventModal,
    setShowEventModal,
    initialEventStartDate,
    initialEventEndDate,
    clearInitialEventDates, // New prop
}) => {
    const [activeTab, setActiveTab] = useState('home-tab');
    const [showFutureDatePopup, setShowFutureDatePopup] = useState(false); // State for popup visibility
    const [futureDatePopupMessage, setFutureDatePopupMessage] = useState(''); // State for popup message

    // Determine if selectedDate is a future date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const dateToCheck = new Date(selectedDate);
    dateToCheck.setHours(0, 0, 0, 0); // Normalize to start of day
    const isFutureDate = dateToCheck > today;

    // If activeTab is records or healthcare and selectedDate is future, switch to home
    useEffect(() => {
        if (isFutureDate && (activeTab === 'records-tab' || activeTab === 'healthcare-tab')) {
            setActiveTab('home-tab');
        }
    }, [selectedDate, isFutureDate, activeTab]);

    const handleTabClick = (tabName) => {
        if (isFutureDate && (tabName === 'records-tab' || tabName === 'healthcare-tab')) {
            setFutureDatePopupMessage('미래 시간에는 기록을 미리 추가하거나<br />확인할 수 없습니다.');
            setShowFutureDatePopup(true);
        } else {
            setActiveTab(tabName);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'home-tab':
                return (
                    <HomeTab
                        userId={userId}
                        selectedDate={selectedDate}
                        dayEvents={dayEvents}
                        monthEvents={monthEvents}
                        todos={todos}
                        onDataUpdate={onDataUpdate} // Pass it down
                        // Pass new props to HomeTab
                        showScheduleModal={showEventModal} // Use showEventModal from Home.js
                        setShowScheduleModal={setShowEventModal} // Use setShowEventModal from Home.js
                        initialScheduleStartDate={initialEventStartDate}
                        initialScheduleEndDate={initialEventEndDate}
                        clearInitialEventDates={clearInitialEventDates} // Pass the new function
                    />
                );
            case 'records-tab':
                return <RecordsTab userId={userId} selectedDate={selectedDate} />;
            case 'healthcare-tab':
                return <HealthcareTab userId={userId} />;
            default:
                return (
                    <HomeTab
                        userId={userId}
                        selectedDate={selectedDate}
                        dayEvents={dayEvents}
                        monthEvents={monthEvents}
                        todos={todos}
                        onDataUpdate={onDataUpdate} // Pass it down
                        // Pass new props to HomeTab
                        showScheduleModal={showEventModal} // Use showEventModal from Home.js
                        setShowScheduleModal={setShowEventModal} // Use setShowEventModal from Home.js
                        initialScheduleStartDate={initialEventStartDate}
                        initialScheduleEndDate={initialEventEndDate}
                        clearInitialEventDates={clearInitialEventDates} // Pass the new function
                    />
                );
        }
    };

    return (
        <div className="right-column">
            <div className="dashboard-container">
                <div className="dashboard-tabs">
                    <button className={`dash-tab-link dash-tab-home ${activeTab === 'home-tab' ? 'active' : ''}`} onClick={() => handleTabClick('home-tab')}>홈</button>
                    <button
                        className={`dash-tab-link dash-tab-records ${activeTab === 'records-tab' ? 'active' : ''} ${isFutureDate ? 'disabled-tab' : ''}`}
                        onClick={() => handleTabClick('records-tab')}
                    >
                        기록
                    </button>
                    <button
                        className={`dash-tab-link dash-tab-healthcare ${activeTab === 'healthcare-tab' ? 'active' : ''} ${isFutureDate ? 'disabled-tab' : ''}`}
                        onClick={() => handleTabClick('healthcare-tab')}
                    >
                        헬스케어
                    </button>
                </div>
                <div className={`dashboard-content-wrapper content-for-${activeTab}`}>
                    {renderTabContent()}
                </div>
            </div>
            {showFutureDatePopup && (
                <Modal show={showFutureDatePopup} onClose={() => setShowFutureDatePopup(false)}>
                    <div className="popup-header">
                        <h3 style={{ color: '#383838', fontSize: '14px', margin: '0', marginRight: '5px' }}>안내</h3>
                        <button onClick={() => setShowFutureDatePopup(false)} className="modal-close-btn">
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L9 9M1 9L9 1" stroke="#383838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div className="popup-content" style={{ padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <p style={{ textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: futureDatePopupMessage }}></p>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Dashboard;