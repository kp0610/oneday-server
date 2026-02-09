import React, { useState, useEffect, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom'; // Removed as back button is removed
import './StopwatchCollection.css'; // Import new CSS
import { BASE_CATEGORY_COLORS_MAP, PREDEFINED_COLORS } from './constants/categoryColors';

const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Helper to format seconds to HH:MM:SS
const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return '00:00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
};

const StopwatchCollection = ({ displayMode = 'summary', sortOrder, setSortOrder, selectedStartDate, selectedEndDate }) => {
    const [allRecords, setAllRecords] = useState([]);
    const userId = localStorage.getItem('userId');
    // const navigate = useNavigate(); // Removed

    useEffect(() => {
        if (!userId) return;
        const fetchRecords = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stopwatch/${userId}`, {
                    cache: 'no-store'
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setAllRecords(data);
            } catch (error) {
                console.error('Failed to fetch stopwatch records:', error);
            }
        };
        fetchRecords();
    }, [userId]);

    // Group records by date for daily view
    const recordsGroupedByDate = useMemo(() => {
        const grouped = {};
        const datesInSelectedRange = getDatesInRange(selectedStartDate, selectedEndDate);

        allRecords.forEach(record => {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            // Only include records within the selected date range
            if (datesInSelectedRange.includes(recordDate)) {
                if (!grouped[recordDate]) {
                    grouped[recordDate] = [];
                }
                grouped[recordDate].push(record);
            }
        });
        return grouped;
    }, [allRecords, selectedStartDate, selectedEndDate]);


    const aggregatedData = useMemo(() => {
        // Filter records by the selected date range
        const filteredRecords = allRecords.filter(record => {
            const recordDateStr = record.date.split('T')[0];
            return recordDateStr >= selectedStartDate && recordDateStr <= selectedEndDate;
        });

        const dataByCategory = {};

        // Iterate through records, then tasks within each record
        filteredRecords.forEach(record => {
            if (record.tasks_data) {
                record.tasks_data.forEach(task => {
                    // Only include completed tasks
                    if (task.isComplete && task.category) {
                        if (!dataByCategory[task.category]) {
                            dataByCategory[task.category] = 0;
                        }
                        // Add elapsed time (which is in ms)
                        dataByCategory[task.category] += task.elapsedTime;
                    }
                });
            }
        });

        return Object.entries(dataByCategory).map(([category, totalTimeMs], index) => ({
            category,
            totalTime: Math.floor(totalTimeMs / 1000), // Convert ms to seconds
            color: BASE_CATEGORY_COLORS_MAP[category] || PREDEFINED_COLORS[index % PREDEFINED_COLORS.length]
        }));
    }, [allRecords, selectedStartDate, selectedEndDate]);

    const sortedData = useMemo(() => {
        return [...aggregatedData].sort((a, b) => {
            return sortOrder === 'desc' ? b.totalTime - a.totalTime : a.totalTime - b.totalTime;
        });
    }, [aggregatedData, sortOrder]);

    const maxTime = useMemo(() => {
        return Math.max(...sortedData.map(d => d.totalTime), 0);
    }, [sortedData]);




    // const handleGoBack = () => { // Removed
    //     navigate(-1); // Go back to the previous page
    // };

    if (displayMode === 'daily') {
        const sortedDates = Object.keys(recordsGroupedByDate).sort((a, b) => new Date(b) - new Date(a));
        // Filter out dates that have no actual completed tasks
        const datesWithData = sortedDates.filter(dateKey => {
            const dailyAggregatedTasks = {};
            recordsGroupedByDate[dateKey].forEach(record => {
                record.tasks_data.forEach(task => {
                    if (task.isComplete && task.category) {
                        dailyAggregatedTasks[task.category] = (dailyAggregatedTasks[task.category] || 0) + task.elapsedTime;
                    }
                });
            });
            return Object.keys(dailyAggregatedTasks).length > 0;
        });

        return datesWithData.length > 0 ? (
            <div className="stopwatch-daily-cards-container">
                {datesWithData.map(dateKey => {
                    const date = new Date(dateKey);
                    const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

                    // Aggregate tasks for the current day by category
                    const dailyAggregatedTasks = {};
                    recordsGroupedByDate[dateKey].forEach(record => {
                        record.tasks_data.forEach(task => {
                            if (task.isComplete && task.category) {
                                if (!dailyAggregatedTasks[task.category]) {
                                    dailyAggregatedTasks[task.category] = 0;
                                }
                                dailyAggregatedTasks[task.category] += task.elapsedTime;
                            }
                        });
                    });

                    const dailyCategories = Object.entries(dailyAggregatedTasks).map(([category, totalTimeMs], index) => ({
                        category,
                        totalTime: Math.floor(totalTimeMs / 1000),
                        color: BASE_CATEGORY_COLORS_MAP[category] || PREDEFINED_COLORS[index % PREDEFINED_COLORS.length]
                    }));

                    return (
                        <div key={dateKey} className="stopwatch-daily-card">
                            <span className="card-date-display">{formattedDate}</span>
                            <div className="stopwatch-card-categories-content">
                                {dailyCategories.map((item, index) => {
                                    const categoryDisplayName = item.category.length > 5 ? item.category.substring(0, 5) + '...' : item.category;
                                    const isLongCategory = item.category.length >= 4; // For layout rule

                                    return (
                                        <div key={index} className={`stopwatch-daily-category-item ${isLongCategory ? 'long-category' : ''}`}>
                                            <div className="stopwatch-daily-category-chip"
                                                 style={{
                                                     backgroundColor: `rgba(${parseInt(item.color.slice(1,3), 16)}, ${parseInt(item.color.slice(3,5), 16)}, ${parseInt(item.color.slice(5,7), 16)}, 0.5)`,
                                                     border: `1px solid ${item.color}`
                                                 }}>
                                                {categoryDisplayName}
                                            </div>
                                            <div className="stopwatch-daily-category-time">{formatTime(item.totalTime)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <div className="empty-data-card">
                    저장된 스톱워치 데이터가 없습니다.
                </div>
            </div>
        );
    } else { // displayMode === 'summary'
        return (
            <div className="stopwatch-collection-container">



                {sortedData.length > 0 ? (
                    <div className="sc-bar-chart-list">
                        {sortedData.map(({ category, totalTime, color }) => (
                            <div key={category} className="sc-category-item">
                                <div className="sc-category-label"
                                    style={{
                                        backgroundColor: `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, 0.5)`,
                                        border: `1px solid ${color}`
                                    }}>
                                    {category}
                                </div>
                                <div className="sc-bar-wrapper">
                                    <div className="sc-bar">
                                        <div
                                            className="sc-bar-fill"
                                            style={{
                                                width: `${maxTime > 0 ? (totalTime / maxTime) * 100 : 0}%`,
                                                                                                                                backgroundColor: `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, 0.5)`,                                                border: `1px solid ${color}`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="sc-time">{formatTime(totalTime)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div className="empty-data-card">
                            저장된 스톱워치 데이터가 없습니다.
                        </div>
                    </div>
                )}
            </div>
        );
    }
};
export default StopwatchCollection;
