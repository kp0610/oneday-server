import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
// import { useOutletContext } from 'react-router-dom'; // Removed
import './Home.css';
import './SlideOutNav.css';
import Calendar from './Calendar';
import Dashboard from './Dashboard';
import { useData } from './DataContext';
import ViewToggle from './ViewToggle'; // Import ViewToggle
import DailySummaryPopup from './DailySummaryPopup'; // Import DailySummaryPopup
import { useProfile } from './ProfileContext'; // Import useProfile
import Template from './Template'; // Import Template component

const Home = () => {
    // const { setIsSlideOutNavOpen } = useOutletContext(); // Removed
    const { refreshProfile } = useProfile(); // Get refreshProfile from context
    const location = useLocation(); // Initialize useLocation

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('status') === 'registered') {
            alert('회원가입이 완료되었습니다!'); // Or use a more sophisticated toast/message system
            // Optionally, remove the query parameter from the URL to prevent showing the alert again on refresh
            // navigate(location.pathname, { replace: true }); // Requires useNavigate
        }
    }, [location]); // Re-run when location changes
    const { selectedDate, setSelectedDate } = useData();
    console.log("Home.js - selectedDate from useData:", selectedDate); // Add this line
    const [isMonthView, setIsMonthView] = useState(true); // State for month/week view
    
    const [monthOffset, setMonthOffset] = useState(0);
    const [weekOffset, setWeekOffset] = useState(0);
    const [dashboardEvents, setDashboardEvents] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [todos, setTodos] = useState([]);
    const [calendarTodos, setCalendarTodos] = useState([]); // New state for the calendar
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const [isDragging, setIsDragging] = useState(false); // Re-introduced
    const [dragStartDayString, setDragStartDayString] = useState(null); // Re-introduced
    const [dragEndDayString, setDragEndDayString] = useState(null); // Re-introduced
    const [showEventModal, setShowEventModal] = useState(false);
    const [initialEventStartDate, setInitialEventStartDate] = useState(null);
    const [initialEventEndDate, setInitialEventEndDate] = useState(null);

    // States for DailySummaryPopup
    const [showDailySummaryPopup, setShowDailySummaryPopup] = useState(false);
    const [dailySummaryDate, setDailySummaryDate] = useState('');
    const [dailySummaryData, setDailySummaryData] = useState(null); // New state for daily summary data

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId || !selectedDate) return;
        
        const fetchDashboardData = async () => {
            try {
                const eventsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${userId}/${selectedDate}`, { cache: 'no-cache', credentials: 'include' });
                const eventsData = eventsRes.ok ? await eventsRes.json() : Promise.reject(new Error('Failed to fetch day events'));
                setDashboardEvents(eventsData);

                const todosRes = await fetch(`${process.env.REACT_APP_API_URL}/api/todos/${userId}/${selectedDate}`, { cache: 'no-cache', credentials: 'include' });
                const todosData = todosRes.ok ? await todosRes.json() : Promise.reject(new Error('Failed to fetch todos'));
                setTodos(todosData);
                // console.log('Home.js - Fetched todosData after update:', JSON.stringify(todosData, null, 2)); // Debug log

                // Prepare dailySummaryData
                const completedTodosCount = todosData.filter(todo => todo.completed === 1).length;
                const totalTodosCount = todosData.length;

                const completedEventsCount = eventsData.filter(event => event.completed === 1).length;
                const totalEventsCount = eventsData.length;

                const newDailySummaryData = {
                    completedTodosCount: completedTodosCount,
                    totalTodosCount: totalTodosCount,
                    completedEventsCount: completedEventsCount,
                    totalEventsCount: totalEventsCount
                };
                setDailySummaryData(newDailySummaryData);
                // console.log('Home.js - Calculated dailySummaryData after update:', JSON.stringify(newDailySummaryData, null, 2)); // Debug log

            } catch (error) {
                console.error("Error fetching daily summary data:", error);
            }
        };

        fetchDashboardData();

    }, [userId, selectedDate, lastUpdated]);

    useEffect(() => {
        if (!userId) return;

        let startDate, endDate;

        if (isMonthView) {
            const dt = new Date();
            dt.setDate(1); // Prevent month overflow
            if (monthOffset !== 0) {
                dt.setMonth(new Date().getMonth() + monthOffset);
            }
            const year = dt.getFullYear();
            const month = dt.getMonth();
            startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            
            // Clear todos in month view
            setCalendarTodos([]);

        } else { // Week view
            let currentWeekStart = new Date();
            currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
            const startOfWeek = new Date(currentWeekStart);
            startOfWeek.setDate(currentWeekStart.getDate() - startOfWeek.getDay());
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            startDate = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
            endDate = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;
            
            // Fetch todos only in week view
            fetch(`${process.env.REACT_APP_API_URL}/api/todos/range/${userId}?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-cache', credentials: 'include' })
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => { throw new Error(err.msg) });
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('Fetched calendar todos:', data);
                    setCalendarTodos(data);
                })
                .catch(error => console.error("Error fetching range todos:", error));
        }

        // Fetch events for both views
        fetch(`${process.env.REACT_APP_API_URL}/api/events/range/${userId}?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-cache', credentials: 'include' })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.msg) });
                }
                return res.json();
            })
            .then(setCalendarEvents)
            .catch(error => console.error("Error fetching range events:", error));

    }, [userId, isMonthView, monthOffset, weekOffset, lastUpdated]);

    const onDataUpdate = () => {
        setLastUpdated(Date.now());
    };

    const handleDragStart = (dayString) => { // Re-introduced
        setIsDragging(true);
        setDragStartDayString(dayString);
        setDragEndDayString(dayString);
    };

    const handleDragMove = (dayString) => { // Re-introduced
        if (isDragging) {
            setDragEndDayString(dayString);
        }
    };

    const handleDragEnd = () => { // Re-introduced
        setIsDragging(false);
        if (dragStartDayString && dragEndDayString) {
            if (dragStartDayString !== dragEndDayString) {
                const startDate = new Date(dragStartDayString);
                const endDate = new Date(dragEndDayString);
                if (startDate > endDate) {
                    setInitialEventStartDate(dragEndDayString);
                    setInitialEventEndDate(dragStartDayString);
                } else {
                    setInitialEventStartDate(dragStartDayString);
                    setInitialEventEndDate(dragEndDayString);
                }
                setShowEventModal(true);
            } else {
                setSelectedDate(dragStartDayString);
            }
        }
        setDragStartDayString(null);
        setDragEndDayString(null);
    };

    const clearInitialEventDates = useCallback(() => {
        setInitialEventStartDate(null);
        setInitialEventEndDate(null);
    }, []);

    return (
        <div className="home-container" onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
            <ViewToggle isMonthView={isMonthView} setIsMonthView={setIsMonthView} /> {/* Render ViewToggle here */}
            <div className="calendar-dashboard-wrapper"> {/* New wrapper */}
                <div className="calendar-area">
                    <Calendar
                        monthOffset={monthOffset}
                        setMonthOffset={setMonthOffset}
                        weekOffset={weekOffset}
                        setWeekOffset={setWeekOffset}
                        events={calendarEvents}
                        todos={calendarTodos}
                        isDragging={isDragging}
                        dragStartDayString={dragStartDayString}
                        dragEndDayString={dragEndDayString}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                        isMonthView={isMonthView} // Pass isMonthView to Calendar
                        showDailySummaryPopup={showDailySummaryPopup} // Pass new prop
                        onSetShowDailySummaryPopup={setShowDailySummaryPopup} // Pass new prop
                        dailySummaryDate={dailySummaryDate} // Pass new prop
                        onSetDailySummaryDate={setDailySummaryDate} // Pass new prop
                    />
                </div>

                <div className="dashboard-area">
                    <Dashboard
                        userId={userId}
                        selectedDate={selectedDate}
                        dayEvents={dashboardEvents}
                        monthEvents={calendarEvents}
                        todos={todos}
                        onDataUpdate={onDataUpdate}
                        showEventModal={showEventModal}
                        setShowEventModal={setShowEventModal}
                        initialEventStartDate={initialEventStartDate}
                        initialEventEndDate={initialEventEndDate}
                        clearInitialEventDates={clearInitialEventDates} // Pass the new function
                        showDailySummaryPopup={showDailySummaryPopup} // Pass new prop
                        setShowDailySummaryPopup={setShowDailySummaryPopup} // Pass new prop
                        dailySummaryDate={dailySummaryDate} // Pass new prop
                        setDailySummaryDate={setDailySummaryDate} // Pass new prop
                    />
                </div>
            </div>
            <DailySummaryPopup
                show={showDailySummaryPopup}
                onClose={() => setShowDailySummaryPopup(false)}
                date={dailySummaryDate}
                dailyData={dailySummaryData}
            />
        </div>
    );
};

export default Home;