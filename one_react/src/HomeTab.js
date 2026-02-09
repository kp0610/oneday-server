import { FaTrash } from 'react-icons/fa';
import { LuCheck } from 'react-icons/lu';
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { HexColorPicker } from "react-colorful"; // Import HexColorPicker
import './HomeTab.css';
import Modal from './Modal';
import Template from './Template';
import ConfirmationModal from './ConfirmationModal';
import MiniCalendar from './MiniCalendar'; // Import MiniCalendar
import { hexToRgba, darkenColor } from './utils/colorUtils';

const getUrgencyClass = (eventDate, selectedDate) => {
    const today = new Date(selectedDate);
    const date = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'urgency-high'; // D-3 or less
    if (diffDays <= 7) return 'urgency-medium'; // D-7 or less
    return 'urgency-low';
};

const getDday = (eventDate, selectedDate) => {
    const today = new Date(selectedDate);
    const date = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return '완료';
    if (diffDays === 0) return 'D-Day';
    return `D-${diffDays}`;
}

const HomeTab = ({
    userId,
    selectedDate,
    dayEvents,
    todos,
    onDataUpdate,
    showScheduleModal,
    setShowScheduleModal,
    initialScheduleStartDate,
    initialScheduleEndDate,
    clearInitialEventDates, // New prop
}) => {
    const [showTodoModal, setShowTodoModal] = useState(false);
    const [showCreateScheduleTemplateModal, setShowCreateScheduleTemplateModal] = useState(false);
    const [newScheduleTitle, setNewScheduleTitle] = useState('');
    const [newScheduleTemplateTitle, setNewScheduleTemplateTitle] = useState('');
    const [newScheduleTemplateColor, setNewScheduleTemplateColor] = useState('#FFE79D'); // Default color
    const [newScheduleColor, setNewScheduleColor] = useState('#FFE79D'); // New state for manually created schedule color
    const defaultColors = ['#FFE79D', '#9DDBFF', '#A5A5A5', '#9DFFA7', '#FFA544'];
    const [newScheduleTime, setNewScheduleTime] = useState('');
    const [newScheduleStartDate, setNewScheduleStartDate] = useState(selectedDate);
    const [newScheduleEndDate, setNewScheduleEndDate] = useState('');
    const [newScheduleSetReminder, setNewScheduleSetReminder] = useState(false);
    const [showScheduleTimePicker, setShowScheduleTimePicker] = useState(false); // New state for time chip
    const [showScheduleRepeat, setShowScheduleRepeat] = useState(false); // New state for repeat chip
    const [newScheduleRepeatSelectedDays, setNewScheduleRepeatSelectedDays] = useState([]);
    const [showScheduleRepeatDayPicker, setShowScheduleRepeatDayPicker] = useState(false);



    // New states for irregular dates (new "요일" functionality)
    const [showScheduleIrregularDatesPicker, setShowScheduleIrregularDatesPicker] = useState(false);
    const [newScheduleIrregularSelectedDates, setNewScheduleIrregularSelectedDates] = useState([]);

    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoSelectedDays, setNewTodoSelectedDays] = useState([]);
    const [showTodoDayPicker, setShowTodoDayPicker] = useState(false);
    const [newTodoColor, setNewTodoColor] = useState('#FFE79D'); // Default color for todo
    const [showTodoColorPicker, setShowTodoColorPicker] = useState(false); // For todo custom color picker
    const todoColorPickerBtnRef = useRef(null); // Ref for the todo custom color button
    const todoColorPickerPaletteRef = useRef(null); // Ref for the todo color picker palette
    const [todoTemplates, setTodoTemplates] = useState([]); // New state for todo templates
    const [scheduleTemplates, setScheduleTemplates] = useState([]); // New state for schedule templates
    const [showCreateTodoTemplateModal, setShowCreateTodoTemplateModal] = useState(false); // New state for todo template modal
    const [newTodoTemplateTitle, setNewTodoTemplateTitle] = useState(''); // New state for new todo template title
    const [newTodoTemplateColor, setNewTodoTemplateColor] = useState('#FFE79D'); // New state for new todo template color
    const [templateToDelete, setTemplateToDelete] = useState(null); // New state for template to delete

    // Effect to close todo color picker on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showTodoColorPicker &&
                todoColorPickerPaletteRef.current &&
                !todoColorPickerPaletteRef.current.contains(event.target) &&
                todoColorPickerBtnRef.current &&
                !todoColorPickerBtnRef.current.contains(event.target)
            ) {
                setShowTodoColorPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTodoColorPicker]);

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [showColorPicker, setShowColorPicker] = useState(false); // For custom color picker
    const colorPickerBtnRef = useRef(null); // Ref for the custom color button
    const colorPickerPaletteRef = useRef(null); // Ref for the color picker palette

    // Swipe logic states
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipedItemId, setSwipedItemId] = useState(null);
    const swipeThreshold = 50; // Pixels to swipe to trigger delete button

    // Effect to close color picker on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showColorPicker &&
                colorPickerPaletteRef.current &&
                !colorPickerPaletteRef.current.contains(event.target) &&
                colorPickerBtnRef.current &&
                !colorPickerBtnRef.current.contains(event.target)
            ) {
                setShowColorPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker]);

    // Effect to close swiped item on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (swipedItemId) {
                const scheduleItemElement = document.getElementById(`schedule-item-${swipedItemId}`);
                const todoItemElement = document.getElementById(`todo-item-${swipedItemId}`);
                const deleteScheduleButtonElement = scheduleItemElement ? scheduleItemElement.querySelector('.delete-schedule-btn') : null;
                const deleteTodoButtonElement = todoItemElement ? todoItemElement.querySelector('.delete-todo-btn') : null;

                if (
                    (scheduleItemElement && !scheduleItemElement.contains(event.target) && (!deleteScheduleButtonElement || !deleteScheduleButtonElement.contains(event.target))) ||
                    (todoItemElement && !todoItemElement.contains(event.target) && (!deleteTodoButtonElement || !deleteTodoButtonElement.contains(event.target)))
                ) {
                    setSwipedItemId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [swipedItemId]);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [confirmationModalProps, setConfirmationModalProps] = useState({
        message: '',
        onConfirm: () => {},
    });

    // Swipe logic handlers
    const handleTouchStart = (e, itemId) => {
        setStartX(e.touches[0].clientX);
        setCurrentX(e.touches[0].clientX);
        setIsSwiping(true);
        if (swipedItemId && swipedItemId !== itemId) {
            setSwipedItemId(null);
        }
    };

    const handleTouchMove = (e, itemId) => {
        if (!isSwiping) return;
        setCurrentX(e.touches[0].clientX);
        const diffX = startX - currentX; // Right to left swipe
        if (diffX > swipeThreshold) {
            setSwipedItemId(itemId);
        } else if (diffX < -swipeThreshold) { // Left to right swipe to close
            setSwipedItemId(null);
        }
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);
        setStartX(0);
        setCurrentX(0);
    };

    const handleMouseDown = (e, itemId) => {
        setStartX(e.clientX);
        setCurrentX(e.clientX);
        setIsSwiping(true);
        if (swipedItemId && swipedItemId !== itemId) {
            setSwipedItemId(null);
        }
    };

    const handleMouseMove = (e, itemId) => {
        if (!isSwiping) return;
        setCurrentX(e.clientX);
        const diffX = startX - currentX;
        if (diffX > swipeThreshold) {
            setSwipedItemId(itemId);
        } else if (diffX < -swipeThreshold) {
            setSwipedItemId(null);
        }
    };

    const handleMouseUp = () => {
        setIsSwiping(false);
        setStartX(0);
        setCurrentX(0);
    };

    // Effect to initialize schedule dates when modal opens
    useEffect(() => {
        if (showScheduleModal) {
            setNewScheduleStartDate(initialScheduleStartDate || selectedDate);
            setNewScheduleEndDate(initialScheduleEndDate || '');
        }
    }, [showScheduleModal, initialScheduleStartDate, initialScheduleEndDate, selectedDate]);

    useEffect(() => {
        if (!userId) return;
        const fetchUpcomingEvents = async () => {
            setIsLoadingEvents(true);
            const startDate = selectedDate;
            const endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
            const endDateString = endDate.toISOString().split('T')[0];
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events/range/${userId}?startDate=${startDate}&endDate=${endDateString}`);
                const data = await res.json();
                if (res.ok) {
                    setUpcomingEvents(data.filter(event => event.setReminder).slice(0, 3));
                }
            } catch (error) {
                setUpcomingEvents([]);
                console.error("Error fetching upcoming events:", error);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        fetchUpcomingEvents();

        const fetchTodoTemplates = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/templates/${userId}?type=todo`);
                const data = await res.json();
                if (res.ok) {
                    setTodoTemplates(data);
                } else {
                    console.error("Failed to fetch todo templates:", data.msg);
                }
            } catch (error) {
                console.error("Error fetching todo templates:", error);
            }
        };

        const fetchScheduleTemplates = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/templates/${userId}?type=schedule`);
                const data = await res.json();
                if (res.ok) {
                    setScheduleTemplates(data);
                } else {
                    console.error("Failed to fetch schedule templates:", data.msg);
                }
            } catch (error) {
                console.error("Error fetching schedule templates:", error);
            }
        };
        fetchTodoTemplates();
        fetchScheduleTemplates();
    }, [userId, selectedDate, onDataUpdate]);

    const handleToggleTodo = async (todoId, currentStatus) => {
        const body = { completed: !currentStatus }; // Send boolean true/false
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/todos/${todoId}/complete`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error('Failed to update todo status');
            onDataUpdate();
        } catch (error) {
            console.error('Error updating todo status:', error);
        }
    };

    const handleToggleSchedule = async (eventId, currentStatus) => {
        const body = { completed: !currentStatus };
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to update schedule status');
            onDataUpdate();
        } catch (error) {
            console.error('Error updating schedule status:', error);
        }
    };

    const handleDeleteSchedule = (eventId) => {
        setConfirmationModalProps({
            message: '일정을 삭제하시겠습니까?',
            onConfirm: () => {
                (async () => {
                    try {
                        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
                            method: 'DELETE',
                        });
                        if (!res.ok) throw new Error('Failed to delete schedule');
                        onDataUpdate();
                    } catch (error) {
                        console.error('Error deleting schedule:', error);
                        alert(`일정 삭제 중 오류가 발생했습니다: ${error.message}`);
                    } finally {
                        setShowConfirmationModal(false);
                    }
                })();
            },
        });
        setShowConfirmationModal(true);
    };

    const handleDeleteTodo = (todoId) => {
        setConfirmationModalProps({
            message: '투두를 삭제하시겠습니까?',
            onConfirm: () => {
                (async () => {
                    try {
                        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/todos/${todoId}`, {
                            method: 'DELETE',
                        });
                        if (!res.ok) throw new Error('Failed to delete todo');
                        onDataUpdate();
                    } catch (error) {
                        console.error('Error deleting todo:', error);
                        alert(`투두 삭제 중 오류가 발생했습니다: ${error.message}`);
                    } finally {
                        setShowConfirmationModal(false);
                    }
                })();
            },
        });
        setShowConfirmationModal(true);
    };

    const handleTemplateDeleteClick = (template) => {
        setTemplateToDelete(template);
        setConfirmationModalProps({
            message: `'${template.title}' 템플릿을 삭제하시겠습니까?`,
            onConfirm: () => handleDeleteTemplate(template.id),
        });
        setShowConfirmationModal(true);
    };

    const handleDeleteTemplate = async (templateId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/templates/${templateId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete template');
            onDataUpdate(); // Refresh data
        } catch (error) {
            console.error('Error deleting template:', error);
            alert(`템플릿 삭제 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setShowConfirmationModal(false);
            setTemplateToDelete(null);
        }
    };
    
    const handleScheduleTemplateClick = async (template) => {
        const body = {
            userId,
            title: template.title,
            time: null, // Default to no specific time
            setReminder: false, // Default to no reminder
            startDate: selectedDate, // Default to the currently selected date
            endDate: null, // Default to no end date
            selectedDays: [], // Default to no specific days
            color: template.color, // Add template color
        };
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save schedule from template');
            onDataUpdate(); // Refresh data
        } catch (error) {
            console.error('Error saving schedule from template:', error);
            alert(`템플릿 일정 저장에 실패했습니다: ${error.message}`);
        }
    };

    const handleScheduleTemplateSelectInModal = (template) => {
        setNewScheduleTitle(template.title);
        // Optionally, if template has other properties like time, reminder, etc., set them here too.
        // For now, just title.
    };

    const handleTodoTemplateClick = async (template) => {
        const body = { userId, title: template.title, date: selectedDate, color: template.color };
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error('Failed to save todo from template');
            onDataUpdate();
        } catch (error) { console.error('Error saving todo from template:', error); }
    };

    const handleTodoTemplateSelectInModal = (template) => {
        setNewTodoTitle(template.title);
        setNewTodoColor(template.color); // Also set the color from the template
        // Optionally, if template has other properties, set them here too.
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hour] = time.split(':');
        return `${parseInt(hour, 10)}시`;
    };
    
    const resetScheduleForm = () => {
        setNewScheduleTitle('');
        setNewScheduleTime('');
        // Initialize from props if available, otherwise use selectedDate
        setNewScheduleStartDate(initialScheduleStartDate || selectedDate);
        setNewScheduleEndDate(initialScheduleEndDate || '');
        setNewScheduleSetReminder(false);
        setNewScheduleRepeatSelectedDays([]); // Renamed
        setShowScheduleRepeatDayPicker(false); // Renamed
        setShowScheduleIrregularDatesPicker(false); // New
        setNewScheduleIrregularSelectedDates([]); // New
        setShowScheduleTimePicker(false); // Reset time picker visibility
        setShowScheduleRepeat(false); // Reset repeat chip visibility
        setNewScheduleColor('#FFE79D'); // Reset schedule color
        setShowScheduleModal(false);
        clearInitialEventDates(); // Clear initial event dates from Home.js
    };

    const resetTodoForm = () => {
        setNewTodoTitle('');
        setNewTodoSelectedDays([]);
        setShowTodoDayPicker(false);
        setNewTodoColor('#FFE79D'); // Reset todo color
        setShowTodoModal(false);
    };

    const handleCreateScheduleTemplate = async () => {
        if (!newScheduleTemplateTitle) return;
        const body = { userId, title: newScheduleTemplateTitle, type: 'schedule', color: newScheduleTemplateColor }; // Add color
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save schedule template');
            onDataUpdate(); // Refresh data
            setShowCreateScheduleTemplateModal(false);
            setNewScheduleTemplateTitle('');
        } catch (error) {
            console.error('Error saving schedule template:', error);
            alert(`일정 템플릿 저장에 실패했습니다: ${error.message}`);
        }
    };

    const handleCreateTodoTemplate = async () => {
        if (!newTodoTemplateTitle) return;
        const body = { userId, title: newTodoTemplateTitle, type: 'todo', color: newTodoTemplateColor }; // Add color
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save todo template');
            onDataUpdate(); // Refresh data
            setShowCreateTodoTemplateModal(false);
            setNewTodoTemplateTitle('');
        } catch (error) {
            console.error('Error saving todo template:', error);
            alert(`투두 템플릿 저장에 실패했습니다: ${error.message}`);
        }
    };

    const handleSaveSchedule = async () => {
        if (!newScheduleTitle) return;

        // Validation for repeating schedules
        if (showScheduleRepeat && showScheduleRepeatDayPicker && !newScheduleEndDate) {
            alert('요일 반복 일정은 종료일을 반드시 지정해야 합니다.');
            return;
        }

        let selectedDaysToSend = [];
        let selectedDatesToSend = [];

        if (showScheduleRepeat && showScheduleRepeatDayPicker) {
            selectedDaysToSend = newScheduleRepeatSelectedDays;
        } else if (showScheduleIrregularDatesPicker) {
            selectedDatesToSend = newScheduleIrregularSelectedDates;
        }

        const body = {
            userId,
            title: newScheduleTitle,
            time: newScheduleTime || null,
            setReminder: newScheduleSetReminder,
            startDate: newScheduleStartDate,
            endDate: newScheduleEndDate,
            selectedDays: selectedDaysToSend, // For repeating schedules
            selectedDates: selectedDatesToSend, // For irregular dates
            color: newScheduleColor, // Add newScheduleColor
        };

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error('Failed to save schedule');
            onDataUpdate();
            resetScheduleForm();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert(`일정 저장에 실패했습니다: ${error.message}`);
        }
    };

    const handleSaveTodo = async () => {
        if (!newTodoTitle) return;
        const body = { userId, title: newTodoTitle, date: selectedDate, selectedDays: newTodoSelectedDays, color: newTodoColor }; // Add color
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error('Failed to save todo');
            onDataUpdate();
            setShowTodoModal(false);
            setNewTodoTitle('');
            setNewTodoSelectedDays([]);
            setShowTodoDayPicker(false);
            setNewTodoColor('#FFE79D'); // Reset color
        } catch (error) {
            console.error('Error saving todo:', error);
            alert(`투두리스트 저장에 실패했습니다: ${error.message}`);
        }
    };

    const handleShowTodoDayPickerChange = (e) => {
        const isChecked = e.target.checked;
        setShowTodoDayPicker(isChecked);
        if (!isChecked) setNewTodoSelectedDays([]);
    };

    const handleDayOfWeekChange = (e) => {
        const dayIndex = parseInt(e.target.value, 10);
        if (e.target.checked) setNewTodoSelectedDays([...newTodoSelectedDays, dayIndex]);
        else setNewTodoSelectedDays(newTodoSelectedDays.filter(d => d !== dayIndex));
    };
    
    const handleShowScheduleRepeatDayPickerChange = (e) => {
        const isChecked = e.target.checked;
        setShowScheduleRepeatDayPicker(isChecked);
        if (!isChecked) setNewScheduleRepeatSelectedDays([]);
    };

    const handleScheduleRepeatDayOfWeekChange = (e) => {
        const dayIndex = parseInt(e.target.value, 10);
        if (e.target.checked) setNewScheduleRepeatSelectedDays([...newScheduleRepeatSelectedDays, dayIndex]);
        else setNewScheduleRepeatSelectedDays(newScheduleRepeatSelectedDays.filter(d => d !== dayIndex));
    };

    const handleShowScheduleIrregularDatesPickerChange = (e) => {
        const isChecked = e.target.checked;
        setShowScheduleIrregularDatesPicker(isChecked);
        if (!isChecked) setNewScheduleIrregularSelectedDates([]);
    };

    const handleScheduleIrregularDateChange = (dateString) => {
        setNewScheduleIrregularSelectedDates(prevDates => {
            if (prevDates.includes(dateString)) {
                return prevDates.filter(d => d !== dateString);
            } else {
                return [...prevDates, dateString];
            }
        });
    };

    const handleShowScheduleTimePickerChange = (e) => {
        setShowScheduleTimePicker(e.target.checked);
        if (!e.target.checked) setNewScheduleTime(''); // Clear time if unchecked
    };

    const handleShowScheduleRepeatChange = (e) => {
        const isChecked = e.target.checked;
        setShowScheduleRepeat(isChecked);
        setShowScheduleRepeatDayPicker(isChecked); // Automatically show/hide day picker
        if (!isChecked) {
            setNewScheduleRepeatSelectedDays([]); // Clear selected days
            setNewScheduleEndDate(''); // Clear end date
        }
    };

    const handleOpenCreateTemplateModal = () => {
        setNewScheduleTemplateColor('#FFE79D'); // Reset to default color
        setShowCreateScheduleTemplateModal(true);
    };

    const handleOpenCreateTodoTemplateModal = () => {
        setNewTodoTemplateColor('#FFE79D'); // Reset to default color
        setNewTodoTemplateTitle(''); // Also reset title
        setShowCreateTodoTemplateModal(true);
    };

    const getTemplateStyle = (template) => {
        return {
            borderColor: template.color,
            backgroundColor: hexToRgba(template.color, 0.5),
            color: darkenColor(template.color, 0.6)
        };
    };

    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const formatDisplayDate = () => {
        if (initialScheduleStartDate && initialScheduleEndDate && initialScheduleStartDate !== initialScheduleEndDate) {
            const startMonth = initialScheduleStartDate.split('-')[1];
            const startDay = initialScheduleStartDate.split('-')[2];
            const endMonth = initialScheduleEndDate.split('-')[1];
            const endDay = initialScheduleEndDate.split('-')[2];

            if (startMonth === endMonth) {
                return `${startMonth}월 ${startDay}일 - ${endDay}일`;
            } else {
                return `${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`;
            }
        }
        return `${selectedDate.split('-')[1]}월 ${selectedDate.split('-')[2]}일`;
    };

    const todayString = getToday();
    const isToday = selectedDate === todayString;

    const scheduleTitle = isToday ? '오늘의 일정' : `${selectedDate.split('-')[1]}.${selectedDate.split('-')[2]} 일정`;
    const todoTitle = isToday ? '오늘의 투두리스트' : `${selectedDate.split('-')[1]}.${selectedDate.split('-')[2]} 투두리스트`;

    return (
        <div className="home-tab-content dash-tab-content active">
            <div className="combined-content-box"> {/* New wrapper */}
                <div className="home-section-grid schedule-section-grid">
                    {/* 오늘의 일정 */}
                    <div className="dashboard-section">
                        <div className="home-card-header">
                            <h3 className="home-card-title">{scheduleTitle}</h3>
                        </div>
                        <div className="home-card-body">
                            {dayEvents.length > 0 ? (
                                dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        id={`schedule-item-${event.id}`} // Add ID here
                                        className={`schedule-item ${event.completed ? 'completed' : ''} ${swipedItemId === event.id ? 'swiped' : ''}`}
                                        onTouchStart={(e) => handleTouchStart(e, event.id)}
                                        onTouchMove={(e) => handleTouchMove(e, event.id)}
                                        onTouchEnd={handleTouchEnd}
                                        onMouseDown={(e) => handleMouseDown(e, event.id)}
                                        onMouseMove={(e) => handleMouseMove(e, event.id)}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp} // To handle cases where mouse leaves the element while swiping
                                    >
                                        <div className="item-checkbox-container" onClick={() => handleToggleSchedule(event.id, event.completed)}>
                                            <div className={`item-checkbox circle ${event.completed ? 'completed' : ''}`}>
                                                <LuCheck className="checkmark-icon" />
                                            </div>
                                        </div>
                                        <span className={`item-title ${event.completed ? 'completed' : ''} ${!event.time ? 'no-time' : ''}`}>{event.title}</span>
                                        <span className="item-time">{formatTime(event.time)}</span>
                                        <button className="delete-schedule-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(event.id); }}><FaTrash /></button>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-message">오늘의 일정이 없습니다.</p>
                            )}
                        </div>
                    </div>

                    {/* 일정 추가 */}
                    <div className="dashboard-section add-schedule-section">
                        <div className="home-card-header">
                            <h3 className="home-card-title">일정 추가</h3>
                        </div>
                        <div className="home-card-body">
                            <Template
                                type="schedule"
                                templates={scheduleTemplates}
                                onTemplateClick={handleScheduleTemplateClick}
                                getTemplateStyle={getTemplateStyle}
                                onTemplateDeleteClick={handleTemplateDeleteClick} // New prop
                            />
                            <button className="home-add-btn" onClick={() => setShowScheduleModal(true)}>+</button>
                        </div>
                    </div>
                </div>

                <div className="home-section-grid todo-section-grid">
                    {/* 투두리스트 */}
                    <div className="dashboard-section">
                        <div className="home-card-header">
                            <h3 className="home-card-title">{todoTitle}</h3>
                        </div>
                        <div className="home-card-body">
                            {todos.length > 0 ? (
                                todos.map(todo => (
                                                                        <div
                                                                            key={todo.id}
                                                                            id={`todo-item-${todo.id}`} // Add ID here
                                                                            className={`todo-item ${swipedItemId === todo.id ? 'swiped' : ''}`}
                                                                            onTouchStart={(e) => handleTouchStart(e, todo.id)}
                                                                            onTouchMove={(e) => handleTouchMove(e, todo.id)}
                                                                            onTouchEnd={handleTouchEnd}
                                                                            onMouseDown={(e) => handleMouseDown(e, todo.id)}
                                                                            onMouseMove={(e) => handleMouseMove(e, todo.id)}
                                                                            onMouseUp={handleMouseUp}
                                                                            onMouseLeave={handleMouseUp} // To handle cases where mouse leaves the element while swiping
                                                                        >
                                                                             <div className="item-checkbox-container" onClick={() => handleToggleTodo(todo.id, todo.completed)}>
                                                                                <div className={`item-checkbox square ${todo.completed ? 'completed' : ''}`}>
                                                                                    <LuCheck className="checkmark-icon" />
                                                                                </div>                                        </div>
                                                                            <span className={`item-title ${todo.completed ? 'completed' : ''} no-time`}>{todo.title}</span>
                                                                            <button className="delete-todo-btn" onClick={(e) => { e.stopPropagation(); handleDeleteTodo(todo.id); }}><FaTrash /></button>
                                                                        </div>                                ))
                            ) : (
                                <p className="empty-message">오늘 할 일이 없습니다.</p>
                            )}
                        </div>
                    </div>

                    <div className="grid-separator"></div>

                    {/* 투두리스트 추가 */}
                    <div className="dashboard-section add-todo-section">
                        <div className="home-card-header">
                            <h3 className="home-card-title">투두리스트 추가</h3>
                        </div>
                        <div className="home-card-body">
                           <Template
                               type="todo"
                               templates={todoTemplates}
                               onTemplateClick={handleTodoTemplateClick}
                               getTemplateStyle={getTemplateStyle}
                               onTemplateDeleteClick={handleTemplateDeleteClick} // New prop
                           />
                           <button className="home-add-btn" onClick={() => setShowTodoModal(true)}>+</button>
                        </div>
                    </div>
                </div>
                
                {/* 리마인더 */}
                <div className="dashboard-section reminder-section">
                    <div className="home-card-header">
                        <h3 className="home-card-title">리마인더</h3>
                    </div>
                    <div className="home-card-body reminder-body">
                         {isLoadingEvents ? <p>로딩 중...</p> : upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => (
                                <div key={event.id} className={`reminder-card ${getUrgencyClass(event.date, selectedDate)}`}>
                                    <div className="reminder-dday-badge">{getDday(event.date, selectedDate)}</div>
                                    <div className="reminder-title">{event.title}</div>
                                    <button className="delete-reminder-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(event.id); }}>x</button>
                                </div>
                            ))
                        ) : <p className="empty-message">리마인더가 없습니다.</p>}
                    </div>
                </div>
            </div> {/* End of combined-content-box */}

            <Modal show={showTodoModal} onClose={resetTodoForm} contentClassName="add-todo-modal">
                <div className="schedule-modal-header">
                    <h3 className="schedule-modal-title">새 투두리스트 추가</h3>
                    <span className="schedule-modal-date">{selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일</span>
                    <button className="modal-close-btn" onClick={resetTodoForm}>x</button>
                </div>
                <div className="todo-day-picker-wrapper">
                    <div className="chip-container">
                        <div><label className="chip-checkbox-label"><input type="checkbox" checked={showTodoDayPicker} onChange={handleShowTodoDayPickerChange} /><span> 요일</span></label></div>
                    </div>
                    {showTodoDayPicker && (
                        <div className="schedule-option-box todo-day-picker-option-box">
                            <div className="days-of-week-container">{['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (<label key={day}><input type="checkbox" value={index} onChange={handleDayOfWeekChange} checked={newTodoSelectedDays.includes(index)} />{day}</label>))}</div>
                        </div>
                    )}
                </div>
                <input type="text" className="schedule-title-input" placeholder="새로운 할 일" value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                    <Template
                        type="todo"
                        templates={todoTemplates}
                        onTemplateClick={handleTodoTemplateSelectInModal}
                        getTemplateStyle={getTemplateStyle}
                        onTemplateDeleteClick={handleTemplateDeleteClick}
                    />
                    <button className="home-add-btn" onClick={handleOpenCreateTodoTemplateModal}>+</button>
                </div>
                <div className="modal-actions"><button onClick={handleSaveTodo}>저장</button><button onClick={resetTodoForm}>취소</button></div>
            </Modal>
            <Modal show={showScheduleModal} onClose={resetScheduleForm} contentClassName="add-schedule-modal-content">
                <div className="schedule-modal-header">
                    <h3 className="schedule-modal-title">새 일정 추가</h3>
                    <span className="schedule-modal-date">{formatDisplayDate()}</span>
                    <button className="modal-close-btn" onClick={resetScheduleForm}>x</button>
                </div>
                <div className="chip-container">
                    <div><label className="chip-checkbox-label"><input type="checkbox" checked={showScheduleTimePicker} onChange={handleShowScheduleTimePickerChange} /><span> 시간</span></label></div>
                    <div><label className="chip-checkbox-label"><input type="checkbox" checked={showScheduleRepeat} onChange={handleShowScheduleRepeatChange} /><span> 반복</span></label></div>
                    <div><label className="chip-checkbox-label"><input type="checkbox" checked={showScheduleIrregularDatesPicker} onChange={handleShowScheduleIrregularDatesPickerChange} /><span> 요일</span></label></div>
                    <div><label className="chip-checkbox-label"><input type="checkbox" checked={newScheduleSetReminder} onChange={() => setNewScheduleSetReminder(!newScheduleSetReminder)} /><span> 리마인더</span></label></div>
                </div>
                {showScheduleTimePicker && (
                    <div className="schedule-option-box">
                        <input type="time" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)} />
                    </div>
                )}
                {showScheduleIrregularDatesPicker && (
                    <div className="schedule-option-box mini-calendar-option-box">
                        <MiniCalendar
                            selectedDates={newScheduleIrregularSelectedDates}
                            onDateChange={handleScheduleIrregularDateChange}
                        />
                    </div>
                )}
                {showScheduleRepeat && (
                    <div className="schedule-option-box">
                        <div className="days-of-week-container">{['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (<label key={day}><input type="checkbox" value={index} onChange={handleScheduleRepeatDayOfWeekChange} checked={newScheduleRepeatSelectedDays.includes(index)} />{day}</label>))}</div>
                        <div className="end-date-container"><label>종료일: <input type="date" value={newScheduleEndDate} onChange={(e) => setNewScheduleEndDate(e.target.value)} /></label></div>
                    </div>
                )}
                <input type="text" className="schedule-title-input" placeholder="일정명을 입력해주세요" value={newScheduleTitle} onChange={(e) => setNewScheduleTitle(e.target.value)} />
                <div className="template-color-picker">
                    {defaultColors.map(color => {
                        const isSelected = newScheduleColor === color;
                        const style = {
                            borderColor: color,
                            backgroundColor: hexToRgba(color, 0.5),
                            border: isSelected ? '2px solid #d3d3d3' : '1px solid transparent',
                        };
                        return (
                            <div
                                key={color}
                                className={`color-circle ${isSelected ? 'selected' : ''}`}
                                style={style}
                                onClick={() => setNewScheduleColor(color)}
                            ></div>
                        );
                    })}
                    <div
                        ref={colorPickerBtnRef}
                        className={`color-circle custom-color-circle ${newScheduleColor && !defaultColors.includes(newScheduleColor) ? 'selected' : ''}`}
                        style={{
                            backgroundColor: newScheduleColor,
                            borderColor: newScheduleColor,
                            borderStyle: 'solid',
                        }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                        {defaultColors.includes(newScheduleColor) && (
                            <div className="plus-icon"></div>
                        )}
                    </div>
                </div>
                {showColorPicker && (
                    <div ref={colorPickerPaletteRef} className="expanded-color-palette">
                        <HexColorPicker color={newScheduleColor} onChange={setNewScheduleColor} />
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '10px' }}>
                                                                            <Template
                                                                                type="schedule"
                                                                                templates={scheduleTemplates} // Pass scheduleTemplates
                                                    onTemplateClick={handleScheduleTemplateSelectInModal} // Changed here
                                                                                getTemplateStyle={getTemplateStyle} // Pass getTemplateStyle
                                                    onTemplateDeleteClick={handleTemplateDeleteClick} // New prop
                                                                                onTemplateDeleteClick={handleTemplateDeleteClick} // New prop
                                                                            />                    <button className="home-add-btn" onClick={handleOpenCreateTemplateModal}>+</button>
                </div>
                <div className="modal-actions"><button onClick={handleSaveSchedule}>저장</button><button onClick={resetScheduleForm}>취소</button></div>
            </Modal>
            <ConfirmationModal
                show={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                onConfirm={confirmationModalProps.onConfirm}
                message={confirmationModalProps.message}
            />

                        <Modal show={showCreateScheduleTemplateModal} onClose={() => setShowCreateScheduleTemplateModal(false)}>

                            

                            <input

                                type="text"

                                placeholder="템플릿명을 입력하세요."

                                value={newScheduleTemplateTitle}

                                onChange={(e) => setNewScheduleTemplateTitle(e.target.value)}

                            />

                            <div className="template-color-picker">

                                {defaultColors.map(color => {

                                                            const isSelected = newScheduleTemplateColor === color;

                                                            const style = {

                                                                borderColor: color,

                                                                backgroundColor: hexToRgba(color, 0.5),

                                                                border: isSelected ? '2px solid #d3d3d3' : '1px solid transparent', // Light gray border for selected

                                                            };

                                    return (

                                        <div

                                            key={color}

                                            className={`color-circle ${isSelected ? 'selected' : ''}`}

                                            style={style}

                                            onClick={() => setNewScheduleTemplateColor(color)}

                                        ></div>

                                    );

                                })}

                                {/* Custom Color Circle */}

                                <div

                                    ref={colorPickerBtnRef}

                                    className={`color-circle custom-color-circle ${newScheduleTemplateColor && !defaultColors.includes(newScheduleTemplateColor) ? 'selected' : ''}`}

                                    style={{

                                        backgroundColor: newScheduleTemplateColor,

                                        borderColor: newScheduleTemplateColor,

                                        borderStyle: 'solid',

                                    }}

                                    onClick={() => setShowColorPicker(!showColorPicker)}

                                >

                                    {defaultColors.includes(newScheduleTemplateColor) && (

                                        <div className="plus-icon"></div>

                                    )}

                                </div>

                            </div>

                            {showColorPicker && (

                                <div ref={colorPickerPaletteRef} className="expanded-color-palette">

                                    <HexColorPicker color={newScheduleTemplateColor} onChange={setNewScheduleTemplateColor} />

                                </div>

                            )}

                            <div className="modal-actions">

                                <button onClick={handleCreateScheduleTemplate}>저장</button>

                                <button onClick={() => setShowCreateScheduleTemplateModal(false)}>취소</button>

                            </div>

                        </Modal>

            

                        {/* Create Todo Template Modal */}

                        <Modal show={showCreateTodoTemplateModal} onClose={() => setShowCreateTodoTemplateModal(false)}>

                            

                            <input

                                type="text"

                                placeholder="템플릿명을 입력하세요."

                                value={newTodoTemplateTitle}

                                onChange={(e) => setNewTodoTemplateTitle(e.target.value)}

                            />

                            <div className="template-color-picker">

                                {defaultColors.map(color => {

                                                            const isSelected = newTodoTemplateColor === color;

                                                            const style = {

                                                                borderColor: color,

                                                                backgroundColor: hexToRgba(color, 0.5),

                                                                border: isSelected ? '2px solid #d3d3d3' : '1px solid transparent', // Light gray border for selected

                                                            };

                                    return (

                                        <div

                                            key={color}

                                            className={`color-circle ${isSelected ? 'selected' : ''}`}

                                            style={style}

                                            onClick={() => setNewTodoTemplateColor(color)}

                                        ></div>

                                    );

                                })}

                                {/* Custom Color Circle */}

                                <div

                                    ref={todoColorPickerBtnRef}

                                    className={`color-circle custom-color-circle ${newTodoTemplateColor && !defaultColors.includes(newTodoTemplateColor) ? 'selected' : ''}`}

                                    style={{

                                        backgroundColor: newTodoTemplateColor,

                                        borderColor: newTodoTemplateColor,

                                        borderStyle: 'solid',

                                    }}

                                    onClick={() => setShowTodoColorPicker(!showTodoColorPicker)}

                                >

                                    {defaultColors.includes(newTodoTemplateColor) && (

                                        <div className="plus-icon"></div>

                                    )}

                                </div>

                            </div>

                            {showTodoColorPicker && (

                                <div ref={todoColorPickerPaletteRef} className="expanded-color-palette">

                                    <HexColorPicker color={newTodoTemplateColor} onChange={setNewTodoTemplateColor} />

                                </div>

                            )}

                            <div className="modal-actions">

                                <button onClick={handleCreateTodoTemplate}>저장</button>

                                <button onClick={() => setShowCreateTodoTemplateModal(false)}>취소</button>

                            </div>

                        </Modal>

                    </div>

                );

            };

export default HomeTab;
