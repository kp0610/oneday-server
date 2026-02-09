import React, { useState, useEffect, useRef } from 'react';
import './Calendar.css';
import { useData } from './DataContext';
import { hexToRgba, darkenColor } from './utils/colorUtils';
import DailySummaryPopup from './DailySummaryPopup'; // Import DailySummaryPopup

const Calendar = ({
    monthOffset,
    setMonthOffset,
    weekOffset,
    setWeekOffset,
    events,
    isDragging,
    dragStartDayString,
    dragEndDayString,
    onDragStart,
    onDragMove,
    onDragEnd,
    isMonthView, // Accept isMonthView as prop
    showDailySummaryPopup, // New prop
    onSetShowDailySummaryPopup, // Renamed prop
    dailySummaryDate, // New prop
    onSetDailySummaryDate, // Renamed prop
}) => {
    const { selectedDate, setSelectedDate, pedometerDataByDate } = useData();
    const calendarDaysRef = useRef(null);
    const [userProfile, setUserProfile] = useState(null); // New state for user profile
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(0); // New state for daily calorie goal
    const [menstrualCycles, setMenstrualCycles] = useState([]); // New state for menstrual cycles
    const [predictedMenstrualCycle, setPredictedMenstrualCycle] = useState(null); // New state for predicted menstrual cycle

    // States for DailySummaryPopup

    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const userId = localStorage.getItem('userId'); // Get userId

    const [lastClickedDate, setLastClickedDate] = useState(null);
    const clickTimer = useRef(null);

    const handleDateClick = async (event, dayInfo) => {
        const clickedElement = event.currentTarget; // The div.day-cell that was clicked

        if (lastClickedDate === dayInfo.dayString) {
            // Double click detected
            setSelectedDate(dayInfo.dayString); // Still select the date
            
            // Calculate position for the popup
            const rect = clickedElement.getBoundingClientRect();
            const calendarRect = calendarDaysRef.current.getBoundingClientRect(); // Get calendar grid position
            
            // console.log('setShowDailySummaryPopup type:', typeof onSetShowDailySummaryPopup);
            onSetDailySummaryDate(dayInfo.dayString);
            onSetShowDailySummaryPopup(true);

            // Clear the timer
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
                clickTimer.current = null;
            }
            setLastClickedDate(null); // Reset for next double click
        } else {
            // First click
            setSelectedDate(dayInfo.dayString);
            onSetShowDailySummaryPopup(false); // Hide popup on single click of a new date

            setLastClickedDate(dayInfo.dayString);
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
            }
            clickTimer.current = setTimeout(() => {
                setLastClickedDate(null); // Reset last clicked date after a delay
            }, 300); // 300ms to detect double click
        }
    };

    // Fetch user profile on component mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserProfile(data);
                    // Set daily calorie goal from profile or default
                    setDailyCalorieGoal(data.target_calories || 2000); // Use target_calories from profile
                } else {
                    console.error("Failed to fetch user profile:", await res.text());
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };
        fetchUserProfile();
    }, [userId]);

    // Fetch menstrual cycles on component mount
    useEffect(() => {
        const fetchMenstrualCycles = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/cycles/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Process history to YYYY-MM-DD format
                    const processedCycles = data.history.map(cycle => ({
                        id: cycle.id,
                        startDate: new Date(cycle.start_date).toISOString().split('T')[0],
                        endDate: new Date(cycle.end_date).toISOString().split('T')[0],
                    }));
                    setMenstrualCycles(processedCycles);

                    // Store predicted cycle
                    if (data.prediction) {
                        setPredictedMenstrualCycle({
                            id: 'predicted', // A unique ID for the predicted cycle
                            startDate: data.prediction.startDate,
                            endDate: data.prediction.endDate,
                        });
                    }
                } else {
                    console.error("Failed to fetch menstrual cycles:", await res.text());
                }
            } catch (error) {
                console.error("Error fetching menstrual cycles:", error);
            }
        };
        fetchMenstrualCycles();
    }, [userId]);

    const handlePrev = () => {
        if (isMonthView) {
            setMonthOffset(monthOffset - 1);
        } else {
            setWeekOffset(weekOffset - 1);
        }
    };

    const handleNext = () => {
        if (isMonthView) {
            setMonthOffset(monthOffset + 1);
        } else {
            setWeekOffset(weekOffset + 1);
        }
    };

    let displayDate = new Date();
    displayDate.setDate(1); // Prevent month overflow
    let days = [];

    if (isMonthView) {
        if (monthOffset !== 0) {
            displayDate.setMonth(new Date().getMonth() + monthOffset);
        }
        const month = displayDate.getMonth();
        const year = displayDate.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const paddingDays = firstDayOfMonth.getDay();

        // Previous month's padding days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = paddingDays; i > 0; i--) {
            days.push({ day: prevMonthLastDay - i + 1, isOtherMonth: true });
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const today = new Date();
            days.push({
                day: i,
                dayString,
                isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === i,
                isSelected: dayString === selectedDate,
                events: events.filter(e => {
                    if (!e.date) return false;
                    const event_date_utc = new Date(e.date);
                    const year = event_date_utc.getFullYear();
                    const month = String(event_date_utc.getMonth() + 1).padStart(2, '0');
                    const day = String(event_date_utc.getDate()).padStart(2, '0');
                    const eventDateString = `${year}-${month}-${day}`;
                    return eventDateString === dayString;
                }),
            });
        }

        // Next month's padding days (limit to 5 weeks total)
        const totalDaysInCalendar = 35; // 5 weeks * 7 days
        const nextMonthDays = totalDaysInCalendar - days.length;
        for (let i = 1; i <= nextMonthDays; i++) {
            days.push({ day: i, isOtherMonth: true });
        }
        // If a month naturally extends to 6 weeks, we will truncate it to 5 weeks.
        // This means some days of the current month might not be visible if they fall into the 6th week.
        days = days.slice(0, totalDaysInCalendar);
    } else { // Week view logic
        let currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7)); // Adjust by weekOffset

        const startOfWeek = new Date(currentWeekStart);
        startOfWeek.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Go to Sunday of the current week

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            days.push({
                day: day.getDate(),
                dayString,
                isToday: new Date().getFullYear() === day.getFullYear() && new Date().getMonth() === day.getMonth() && new Date().getDate() === day.getDate(),
                isSelected: dayString === selectedDate,
                events: events.filter(e => {
                    if (!e.date) return false;
                    const event_date_utc = new Date(e.date);
                    const year = event_date_utc.getFullYear();
                    const month = String(event_date_utc.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(event_date_utc.getDate()).padStart(2, '0');
                    const eventDateString = `${year}-${month}-${dayOfMonth}`;
                    return eventDateString === dayString;
                }),
            });
        }
        // For week view, the month and year in the header should reflect the week
        // I'll use the month/year of the first day of the week for simplicity
        displayDate = startOfWeek;
    }

    const month = displayDate.getMonth();
    const year = displayDate.getFullYear();

    const isDateInDraggedRange = (currentDayString) => {
        if (!dragStartDayString || !dragEndDayString) return false;
        const start = new Date(dragStartDayString);
        const end = new Date(dragEndDayString);
        const current = new Date(currentDayString);
        start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0); current.setHours(0, 0, 0, 0);
        const minDate = start < end ? start : end;
        const maxDate = start < end ? end : start;
        return current >= minDate && current <= maxDate;
    };

    return (
        <div className="calendar-wrapper">
            {/* Removed ViewToggle from here */}
            <div className="calendar-header">
                <div className="month-year-container">
                    <p className="month-text">{monthNames[month]}</p>
                    <p className="year-text">{year}</p>
                </div>
                <div className="calendar-nav">
                    <button onClick={handlePrev} className="nav-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                        </svg>
                    </button>
                    <button onClick={handleNext} className="nav-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.59 16.59L13.17 12l-4.58-4.59L10 6l6 6-6 6z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={`calendar-grid ${!isMonthView ? 'week-view' : ''}`}> {/* Conditionally add week-view class */}
                <div className="calendar-weekdays">
                    {weekdays.map(day => <div key={day} className="weekday">{day}</div>)}
                </div>
                <div className="calendar-days" ref={calendarDaysRef}>
                    {days.map((dayInfo, index) => (
                        <div
                            key={index}
                            data-date={dayInfo.dayString} // Add data-date for easy selection
                            className={`day-cell ${dayInfo.isOtherMonth ? 'other-month' : ''} ${dayInfo.isToday ? 'today' : ''} ${dayInfo.isSelected ? 'selected' : ''} ${isDateInDraggedRange(dayInfo.dayString) ? 'drag-selected' : ''}`}
                            onClick={(e) => dayInfo.dayString && handleDateClick(e, dayInfo)}
                            onMouseDown={() => dayInfo.dayString && onDragStart(dayInfo.dayString)}
                            onMouseEnter={() => dayInfo.dayString && onDragMove(dayInfo.dayString)}
                            onMouseUp={onDragEnd}
                        >
                                                                                                                <div className="day-number-wrapper">
                                                                                                                    <p>{dayInfo.day}</p>
                                                                                                                </div>                                                                                    {/* Menstrual Cycle Indicator */}
                                                                                    {menstrualCycles.filter(cycle => dayInfo.dayString >= cycle.startDate && dayInfo.dayString <= cycle.endDate).map(cycle => (
                                                                                        <div
                                                                                            key={cycle.id}
                                                                                                                                                                    className="menstrual-cycle-indicator"
                                                                                                                                                                    style={{
                                                                                                                                                                        backgroundColor: 'rgba(255, 131, 131, 0.1)', // #FF8383 with 10% transparency
                                                                                                                                                                        height: '22px', // Increased height by 2px
                                                                                                                                                                        position: 'absolute',
                                                                                                                                                                        left: 0,
                                                                                                                                                                        right: 0,
                                                                                                                                                                        top: '4px', // Adjusted top to extend 1px upwards
                                                                                                                                                                        zIndex: 0, // Underneath day number
                                                                                                                                                                        borderRadius: dayInfo.dayString === cycle.startDate ? '15px 0 0 15px' :
                                                                                                                                                                                      dayInfo.dayString === cycle.endDate ? '0 15px 15px 0' : '0',
                                                                                                                                                                        borderTop: 'none',
                                                                                                                                                                        borderBottom: 'none',
                                                                                                                                                                        borderLeft: 'none',
                                                                                                                                                                        borderRight: 'none',
                                                                                                                                                                        boxSizing: 'border-box', // Ensure border doesn't increase total size
                                                                                                                                                                    }}
                                                                                                                                                                ></div>
                                                                                                                                                            ))}
                                                                                                                                
                                                                                                                                                                                        {/* Predicted Menstrual Cycle Indicator */}
                                                                                                                                
                                                                                                                                                                                        {predictedMenstrualCycle &&
                                                                                                                                
                                                                                                                                                                                         dayInfo.dayString >= predictedMenstrualCycle.startDate &&
                                                                                                                                
                                                                                                                                                                                         dayInfo.dayString <= predictedMenstrualCycle.endDate && (
                                                                                                                                
                                                                                                                                                                                            <div
                                                                                                                                
                                                                                                                                                                                                key={predictedMenstrualCycle.id}
                                                                                                                                
                                                                                                                                                                                                className="predicted-menstrual-cycle-indicator" // New class for styling
                                                                                                                                
                                                                                                                                                                                                style={{
                                                                                                                                
                                                                                                                                                                                                    backgroundColor: 'rgba(255, 131, 131, 0.1)', // Lighter shade
                                                                                                                                
                                                                                                                                                                                                    height: '22px',
                                                                                                                                
                                                                                                                                                                                                    position: 'absolute',
                                                                                                                                
                                                                                                                                                                                                    left: 0,
                                                                                                                                
                                                                                                                                                                                                    right: 0,
                                                                                                                                
                                                                                                                                                                                                    top: '4px',
                                                                                                                                
                                                                                                                                                                                                    zIndex: 0,
                                                                                                                                
                                                                                                                                                                                                    borderRadius: dayInfo.dayString === predictedMenstrualCycle.startDate ? '15px 0 0 15px' :
                                                                                                                                
                                                                                                                                                                                                                  dayInfo.dayString === predictedMenstrualCycle.endDate ? '0 15px 15px 0' : '0',
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                        borderTop: 'none',
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                        borderBottom: 'none',
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                        borderLeft: 'none',
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                        borderRight: 'none',
                                                                                                                                
                                                                                                                                                                                                    boxSizing: 'border-box', // Ensure border doesn't increase total size
                                                                                                                                
                                                                                                                                                                                                }}
                                                                                                                                
                                                                                                                                                                                            ></div>
                                                                                                                                
                                                                                                                                                                                        )}
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                    {/* Multi-day Event Indicator */}
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                    {(() => {
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                        const multiDayEventsForDay = events.filter(e => {
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            if (!e.start_date || !e.end_date || e.type === 'menstrualCycle') return false;
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                        
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            const filterStartDate = new Date(e.start_date).toISOString().split('T')[0];
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            const filterEndDate = new Date(e.end_date).toISOString().split('T')[0];
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                        
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            return filterStartDate !== filterEndDate && dayInfo.dayString >= filterStartDate && dayInfo.dayString <= filterEndDate;
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                        });
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                        // console.log(`Day: ${dayInfo.dayString}, All Events Prop:`, events);
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                        // console.log(`Day: ${dayInfo.dayString}, Filtered Multi-day Events for Day:`, multiDayEventsForDay);
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                        
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                        return multiDayEventsForDay.map(event => {
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            const eventColor = event.color || '#A0A0A0'; // Default grey if no color
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            const eventStartDate = new Date(event.start_date).toISOString().split('T')[0];
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            const eventEndDate = new Date(event.end_date).toISOString().split('T')[0];
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                        
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            return (
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                <div
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                    key={event.id}
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                    className="multi-day-event-indicator"
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                    style={{
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        backgroundColor: hexToRgba(eventColor, 0.1), // 10% transparent
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        height: '22px',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        position: 'absolute',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        left: 0,
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        right: 0,
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        top: '4px',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        zIndex: 0,
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        borderRadius: dayInfo.dayString === eventStartDate ? '15px 0 0 15px' :
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                      dayInfo.dayString === eventEndDate ? '0 15px 15px 0' : '0',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     borderTop: 'none',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                borderBottom: 'none',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                borderLeft: 'none',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                borderRight: 'none',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                        boxSizing: 'border-box',
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                    }}
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                ></div>
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                        });
                                                                                                                                
                                                                                                                                                            
                                                                                                                                
                                                                                                                                                                                                                                                                                                                                    })()}                            <div className="events-container">
                                {dayInfo.events && dayInfo.events.map(event => {
                                    const style = {};
                                    if (event.color) {
                                        style.borderStyle = 'solid';
                                        style.borderColor = event.color;
                                        style.borderWidth = '0.7px';
                                        style.borderLeftWidth = '4px';
                                        style.backgroundColor = hexToRgba(event.color, 0.5);
                                        style.color = darkenColor(event.color, 0.7);
                                        style.fontSize = '9px';
                                    }

                                    return (
                                        <div
                                            key={event.id}
                                            className="event"
                                            style={style}
                                        >
                                            {event.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Calendar;