import React, { useState } from 'react';
import './Dashboard.css';
import HomeTab from './HomeTab';
import RecordsTab from './RecordsTab';
import HealthcareTab from './HealthcareTab';

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
                    <button className={`dash-tab-link dash-tab-home ${activeTab === 'home-tab' ? 'active' : ''}`} onClick={() => setActiveTab('home-tab')}>홈</button>
                    <button className={`dash-tab-link dash-tab-records ${activeTab === 'records-tab' ? 'active' : ''}`} onClick={() => setActiveTab('records-tab')}>기록</button>
                    <button className={`dash-tab-link dash-tab-healthcare ${activeTab === 'healthcare-tab' ? 'active' : ''}`} onClick={() => setActiveTab('healthcare-tab')}>헬스케어</button>
                </div>
                <div className={`dashboard-content-wrapper content-for-${activeTab}`}>
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;