import React, { useState, useEffect, useRef } from 'react';
import './Stopwatch.css';
import { PREDEFINED_COLORS, BASE_CATEGORY_NAMES, BASE_CATEGORY_COLORS_MAP } from './constants/categoryColors';

const Stopwatch = ({ userId, selectedDate }) => {
    const [tasks, setTasks] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [selectedNewCategoryColor, setSelectedNewCategoryColor] = useState(PREDEFINED_COLORS[0]); // Default color from constants
    const [isAddCategoryPopupOpen, setIsAddCategoryPopupOpen] = useState(false); // State for popup visibility
    const [deletableCategory, setDeletableCategory] = useState(null); // State for category showing delete button
    const intervalRef = useRef(null);
    const longPressTimerRef = useRef(null);

    // ... (useEffect for data fetching remains same)

    const handleLongPressStart = (categoryName) => {
        if (categoryName === '공부') return; // Prevent deletion of '공부' category
        longPressTimerRef.current = setTimeout(() => {
            setDeletableCategory(categoryName);
        }, 400); // 0.4 second long press
    };

    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleDeleteCategory = (e, categoryName) => {
        e.stopPropagation();
        const updatedCategories = categories.filter(c => c.name !== categoryName);
        setCategories(updatedCategories);
        saveCategories(updatedCategories); // Persist category changes
        setDeletableCategory(null);
        if (selectedCategory === categoryName) {
            setSelectedCategory(null);
        }
    };

    // Close delete mode when clicking elsewhere
    useEffect(() => {
        const handleClickOutside = () => setDeletableCategory(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Fetch categories once on component mount
    useEffect(() => {
        if (!userId) return;
        const fetchCategories = async () => {
            const baseCategories = BASE_CATEGORY_NAMES.map(name => ({
                name,
                color: BASE_CATEGORY_COLORS_MAP[name]
            }));
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/stopwatch/categories/${userId}`);
                if (res.ok) {
                    const fetchedCategories = await res.json();
                    if (fetchedCategories && fetchedCategories.length > 0) {
                        const combinedCategoriesMap = new Map();
                        baseCategories.forEach(cat => combinedCategoriesMap.set(cat.name, cat));
                        fetchedCategories.forEach(cat => combinedCategoriesMap.set(cat.name, cat));
                        setCategories(Array.from(combinedCategoriesMap.values()));
                    } else {
                        setCategories(baseCategories);
                    }
                } else {
                    setCategories(baseCategories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories(baseCategories);
            }
        };
        fetchCategories();
    }, [userId]);


    // Fetch tasks for the selected date
    useEffect(() => {
        if (!userId || !selectedDate) return;

        const fetchTasks = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/stopwatch/${userId}/${selectedDate}`);
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data?.tasks_data || []);
                } else {
                    setTasks([]);
                }
            } catch (error) {
                console.error("Error fetching stopwatch data:", error);
                setTasks([]);
            }
        };

        fetchTasks();
    }, [userId, selectedDate]);

    // Refs to store previous date and tasks for reliable saving on navigation
    const prevDateRef = useRef();
    const prevTasksRef = useRef();

    useEffect(() => {
        // When selectedDate changes, save the tasks for the *previous* date
        if (prevDateRef.current && prevDateRef.current !== selectedDate) {
            saveTasks(prevTasksRef.current, prevDateRef.current);
        }

        // Update refs for the next render
        prevDateRef.current = selectedDate;
        prevTasksRef.current = tasks;
    }, [selectedDate, tasks]);

    const saveTasks = async (currentTasks, dateToSave) => {
        if (!userId || !dateToSave || !currentTasks) return;
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/stopwatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    date: dateToSave,
                    tasksData: currentTasks,
                }),
            });
        } catch (error) {
            console.error("Network error saving stopwatch tasks:", error);
        }
    };
    
    const saveCategories = async (currentCategories) => {
        if (!userId) return;
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/stopwatch/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    categoriesData: currentCategories,
                }),
            });
        } catch (error) {
            console.error("Network error saving categories:", error);
        }
    };

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTasks(prevTasks =>
                prevTasks.map(task => 
                    (!task.isPaused && !task.isComplete) 
                        ? { ...task, elapsedTime: task.elapsedTime + 1000 } 
                        : task
                )
            );
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const selectCategory = (categoryObject) => { // Accept category object
        setSelectedCategory(categoryObject.name); // Set selected category name
        if (!tasks.some(task => task.category === categoryObject.name && !task.isComplete)) {
            const newTask = {
                id: Date.now(),
                category: categoryObject.name,
                color: categoryObject.color, // Include color in the new task
                elapsedTime: 0,
                isPaused: true,
                isComplete: false,
            };
            const updatedTasks = [...tasks, newTask];
            setTasks(updatedTasks);
            saveTasks(updatedTasks, selectedDate);
        }
    };

    const startTask = (task) => {
        if (!task || !task.isPaused) return;
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, isPaused: false } : t);
        setTasks(updatedTasks);
        saveTasks(updatedTasks, selectedDate);
    };

    const pauseTask = (task) => {
        if (!task || task.isPaused) return;
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, isPaused: true } : t);
        setTasks(updatedTasks);
        saveTasks(updatedTasks, selectedDate);
    };

    const resetTask = (task) => {
        if (!task || !task.isPaused) return;
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, elapsedTime: 0 } : t);
        setTasks(updatedTasks);
        saveTasks(updatedTasks, selectedDate);
    };

    const finishTask = (taskId) => {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isComplete: true, isPaused: true } : t);
        setTasks(updatedTasks);
        saveTasks(updatedTasks, selectedDate);
        if (selectedCategory === tasks.find(t => t.id === taskId)?.category) {
            setSelectedCategory(null);
        }
    };

    const deleteTask = (taskId) => {
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        setTasks(updatedTasks);
        saveTasks(updatedTasks, selectedDate);
    };

    const addNewCategory = () => {
        if (newCategory && !categories.some(cat => cat.name === newCategory)) {
            const newCatObject = { name: newCategory, color: selectedNewCategoryColor };
            const updatedCategories = [...categories, newCatObject];
            setCategories(updatedCategories);
            setNewCategory('');
            saveCategories(updatedCategories); // Persist category changes
            setIsAddCategoryPopupOpen(false); // Close the popup after adding category
        }
    };
    
    const selectedTask = tasks.find(t => t.category === selectedCategory && !t.isComplete);

    return (
        <div className="stopwatch-container" data-node-id="661:4003">
            <div className="stopwatch-top-section">
                <div className="category-section" data-node-id="661:4148">
    
                    <div className="category-list">
                        {categories.map(cat => (
                            <div 
                                key={cat.name} 
                                className={`category-chip ${selectedCategory === cat.name ? 'selected' : ''} ${cat.name.length >= 4 ? 'wide' : ''}`}
                                style={{
                                    backgroundColor: `rgba(${parseInt(cat.color.slice(1,3), 16)}, ${parseInt(cat.color.slice(3,5), 16)}, ${parseInt(cat.color.slice(5,7), 16)}, 0.5)`,
                                    border: `1px solid ${cat.color}`
                                }}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!deletableCategory) selectCategory(cat); 
                                }}
                                onMouseDown={() => handleLongPressStart(cat.name)}
                                onMouseUp={handleLongPressEnd}
                                onMouseLeave={handleLongPressEnd}
                                onTouchStart={() => handleLongPressStart(cat.name)}
                                onTouchEnd={handleLongPressEnd}
                                onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
                            >
                                <span className="category-name">
                                    {cat.name.length > 5 ? `${cat.name.substring(0, 5)}..` : cat.name}
                                </span>
                                {cat.name === '공부' && !deletableCategory && (
                                    <button 
                                        className="add-category-trigger-button"
                                        onClick={(e) => { e.stopPropagation(); setIsAddCategoryPopupOpen(true); }}
                                    >
                                        +
                                    </button>
                                )}
                                {deletableCategory === cat.name && (
                                    <button 
                                        className="delete-category-button"
                                        onClick={(e) => handleDeleteCategory(e, cat.name)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
                
                <div className="main-stopwatch" data-node-id="661:4191">
                    <h3>
                        {selectedCategory 
                            ? (selectedCategory.length > 12 ? `${selectedCategory.substring(0, 12)}...` : selectedCategory)
                            : '카테고리를 선택하세요'}
                    </h3>
                    <div className="timer-display" data-node-id="661:4197">
                        {selectedTask ? formatTime(selectedTask.elapsedTime) : '00:00:00'}
                    </div>
                    <div className="main-controls" data-node-id="661:4198">
                        <button 
                            onClick={() => selectedTask && (selectedTask.isPaused ? startTask(selectedTask) : pauseTask(selectedTask))}
                            disabled={!selectedTask}
                            className={`start-button ${selectedTask && !selectedTask.isPaused ? 'pause-state' : ''}`}
                        >
                                                        {selectedTask && !selectedTask.isPaused ? '일시정지' : '시작'}
                        </button>
                        <button 
                            onClick={() => resetTask(selectedTask)}
                            disabled={!selectedTask || !selectedTask.isPaused}
                            className="reset-button"
                        >
                            초기화
                        </button>
                    </div>
                </div>
            </div>

            <div className="task-list-section" data-node-id="661:4171">

                <ul className="stopwatch-task-list">
                    {tasks.filter(t => !t.isComplete).map(task => (
                        <li key={task.id}>
                            <div className="task-details">
                                <span 
                                    className="task-category-chip" 
                                    style={{
                                        backgroundColor: `rgba(${parseInt(task.color?.slice(1,3), 16)}, ${parseInt(task.color?.slice(3,5), 16)}, ${parseInt(task.color?.slice(5,7), 16)}, 0.5)`,
                                        border: `1px solid ${task.color}`
                                    }}
                                    onClick={() => selectCategory({name: task.category, color: task.color})}
                                >
                                    {task.category.length > 14 ? `${task.category.substring(0, 14)}...` : task.category}
                                </span>
                                <div className="task-separator-line"></div>
                                <span>{formatTime(task.elapsedTime)}</span>
                            </div>
                            <button
                                className="play-pause-button"
                                onClick={() => task.isPaused ? startTask(task) : pauseTask(task)}
                            >
                                {task.isPaused ? '▶' : '⏸'}
                            </button>
                            <button onClick={() => finishTask(task.id)}>완료</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`task-list-section ${tasks.filter(t => t.isComplete).length === 0 ? 'hide-border' : ''}`} data-node-id="661:4172">

                <ul className="stopwatch-task-list">
                    {tasks.filter(t => t.isComplete).map(task => (
                        <li key={task.id}>
                            <div className="task-details">
                                <span 
                                    className="task-category-chip" 
                                    style={{
                                        backgroundColor: `rgba(${parseInt(task.color?.slice(1,3), 16)}, ${parseInt(task.color?.slice(3,5), 16)}, ${parseInt(task.color?.slice(5,7), 16)}, 0.5)`,
                                        border: `1px solid ${task.color}`
                                    }}
                                >
                                    {task.category.length > 11 ? `${task.category.substring(0, 11)}...` : task.category}
                                </span>
                                <div className="task-separator-line"></div>
                                <span>{formatTime(task.elapsedTime)}</span>
                            </div>
                            <button className="delete-button-circle" onClick={() => deleteTask(task.id)}>-</button>
                        </li>
                    ))}
                </ul>
            </div>
            {isAddCategoryPopupOpen && (
                <div className="add-category-popup-overlay">
                    <div className="add-category-popup-content">
                        <button className="add-category-popup-close-button" onClick={() => setIsAddCategoryPopupOpen(false)}>X</button>
                        <h4>새 카테고리 추가</h4>
                        <div className="add-category-wrapper">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="카테고리 이름 "
                            />
                            <button onClick={addNewCategory}>+</button>
                        </div>
                        <div className="color-picker-palette">
                            {PREDEFINED_COLORS.map(color => (
                                <div
                                    key={color}
                                    className={`color-swatch ${selectedNewCategoryColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedNewCategoryColor(color)}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stopwatch;
