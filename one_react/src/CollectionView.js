import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HealthcareCollection from './HealthcareCollection';
import StopwatchCollection from './StopwatchCollection';
import DiaryCollection from './DiaryCollection';
import MiniCalendar from './MiniCalendar'; // Import MiniCalendar
import SortToggle from './SortToggle'; // Import SortToggle
import { useData } from './DataContext'; // Import useData
import MealSummaryDisplay from './MealSummaryDisplay'; // Import MealSummaryDisplay
import './CollectionView.css'; // New CSS file for CollectionView

const CollectionButton = ({ label, isActive, onClick }) => {
    const buttonStyle = {
        width: '114.28px',
        height: '39px',
        borderRadius: '26.76px',
        fontSize: '16.33px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        border: '1px solid #E1E7EF',
        backgroundColor: isActive ? '#FF7581' : '#F9FAFD',
        color: isActive ? '#FCFDFD' : '#3F3F3F',
    };

    return (
        <div style={buttonStyle} onClick={onClick}>
            {label}
        </div>
    );
};

// Helper functions for date calculations
const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

const getSevenDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
};

// Helper to format MM/DD or MM/DD-MM/DD
const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const format = (date) => {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
    };

    if (start.toDateString() === end.toDateString()) {
        return format(start);
    } else {
        return `${format(start)}-${format(end)}`;
    }
};

const formatTodayMMDD = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${month}/${day}`;
};

const CollectionView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedCollection, setSelectedCollection] = useState('healthcare'); // Default to healthcare
    const [currentMonthYear, setCurrentMonthYear] = useState(new Date()); // State for MiniCalendar's displayed month/year
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for high, 'asc' for low
    const [selectedStartDate, setSelectedStartDate] = useState(getSevenDaysAgo());
    const [selectedEndDate, setSelectedEndDate] = useState(getToday());
    const [tempSelectedDate, setTempSelectedDate] = useState(null); // For handling single date selection in MiniCalendar
    const { mealsByDate, setActiveDateRange } = useData();


    useEffect(() => {
        // Update activeDateRange in DataContext whenever selectedStartDate or selectedEndDate changes
        setActiveDateRange({ startDate: selectedStartDate, endDate: selectedEndDate });
    }, [selectedStartDate, selectedEndDate, setActiveDateRange]);

    useEffect(() => {
        // Set selected collection based on URL path
        if (location.pathname.includes('/healthcare-collection')) {
            setSelectedCollection('healthcare');
        } else if (location.pathname.includes('/stopwatch-collection')) {
            setSelectedCollection('stopwatch');
        } else if (location.pathname.includes('/diary-collection')) {
            setSelectedCollection('diary');
        }
    }, [location.pathname]);

    const handleCollectionChange = (collectionType) => {
        setSelectedCollection(collectionType);
        // Also update the URL to reflect the selected collection
        navigate(`/${collectionType}-collection`);
    };

    const handleDateSelect = (dateString) => {
        if (tempSelectedDate) { // Second click (or more)
            const start = new Date(tempSelectedDate);
            const end = new Date(dateString);

            if (start.toDateString() === end.toDateString()) { // Clicked the same date again
                setSelectedStartDate(dateString);
                setSelectedEndDate(dateString);
                setTempSelectedDate(null); // Finalize single date selection
            } else { // Different date, form a range
                if (start > end) {
                    setSelectedStartDate(dateString);
                    setSelectedEndDate(tempSelectedDate);
                } else {
                    setSelectedStartDate(tempSelectedDate);
                    setSelectedEndDate(dateString);
                }
                setTempSelectedDate(null); // Finalize range selection
            }
        } else { // First click
            setSelectedStartDate(dateString);
            setSelectedEndDate(dateString); // Default to single day range
            setTempSelectedDate(dateString); // Store for potential second click
        }
    };

    return (
        <div className="collection-view-container">
            <div className="collection-header-wrapper">
                <div className="collection-buttons-wrapper">
                    <CollectionButton
                        label="헬스케어"
                        isActive={selectedCollection === 'healthcare'}
                        onClick={() => handleCollectionChange('healthcare')}
                    />
                    <CollectionButton
                        label="스톱워치"
                        isActive={selectedCollection === 'stopwatch'}
                        onClick={() => handleCollectionChange('stopwatch')}
                    />
                    <CollectionButton
                        label="다이어리"
                        isActive={selectedCollection === 'diary'}
                        onClick={() => handleCollectionChange('diary')}
                    />
                </div>
                {(selectedCollection === 'healthcare' || selectedCollection === 'stopwatch') && (
                    <SortToggle sortOrder={sortOrder} setSortOrder={setSortOrder} />
                )}
            </div>

            <div className="collection-content-wrapper">
                <div className="collection-left-box">
                    {selectedCollection === 'healthcare' && <HealthcareCollection sortOrder={sortOrder} setSortOrder={setSortOrder} selectedStartDate={selectedStartDate} selectedEndDate={selectedEndDate} />}
                    {selectedCollection === 'stopwatch' && <StopwatchCollection displayMode="daily" sortOrder={sortOrder} setSortOrder={setSortOrder} selectedStartDate={selectedStartDate} selectedEndDate={selectedEndDate} />}
                    {selectedCollection === 'diary' && <DiaryCollection selectedStartDate={selectedStartDate} selectedEndDate={selectedEndDate} />}
                </div>
                <div className="collection-right-box">
                    <div className="collection-right-box-top">
                        <MiniCalendar
                            selectedStartDate={selectedStartDate}
                            selectedEndDate={selectedEndDate}
                            onDateSelect={handleDateSelect}
                            currentMonthYear={currentMonthYear}
                            setCurrentMonthYear={setCurrentMonthYear}
                        />
                    </div>
                    <div className="collection-right-box-bottom">
                        <div className="collection-date-display">
                            {selectedCollection === 'diary' ? (
                                formatTodayMMDD()
                            ) : (
                                formatDateRange(selectedStartDate, selectedEndDate)
                            )}
                        </div>
                        {selectedCollection === 'healthcare' && (
                            <MealSummaryDisplay
                                mealsByDate={mealsByDate}
                                selectedStartDate={selectedStartDate}
                                selectedEndDate={selectedEndDate}
                                sortOrder={sortOrder}
                            />
                        )}
                        {selectedCollection === 'stopwatch' && (
                            <StopwatchCollection displayMode="summary" sortOrder={sortOrder} setSortOrder={setSortOrder} selectedStartDate={selectedStartDate} selectedEndDate={selectedEndDate} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionView;
