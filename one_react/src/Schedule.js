import React from 'react';

const Schedule = ({ selectedDate, events, onDataUpdate }) => {
    const toggleEventCompletion = async (eventId, currentStatus) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus }),
            });
            if (!res.ok) throw new Error('Failed to update event status');
            onDataUpdate(); // Refetch data
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const deleteEvent = async (eventId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete event');
            onDataUpdate(); // Refetch data
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const todaysEvents = events.filter(event => event.date === selectedDate).sort((a, b) => {
        if (a.time && b.time) {
            return a.time.localeCompare(b.time);
        }
        if (a.time) return -1; // Events with time come before events without
        if (b.time) return 1;
        return 0; // Both have no time, maintain original order
    });

    return (
        <div id="schedule-list" className="section-content">
            {todaysEvents.length === 0 ? (
                <p>등록된 일정이 없습니다.</p>
            ) : (
                <ul>
                    {todaysEvents.map(event => (
                        <li key={event.id} className={`schedule-item ${event.completed ? 'completed' : ''}`}>
                            <input 
                                type="checkbox" 
                                checked={event.completed} 
                                onChange={() => toggleEventCompletion(event.id, event.completed)} 
                            />
                            <span className="schedule-title">{event.title}</span>
                            {event.time && <span className="schedule-time">{event.time}</span>}
                            <button className="delete-item-btn" onClick={() => deleteEvent(event.id)}>×</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Schedule;
