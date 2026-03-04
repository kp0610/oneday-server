import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { useProfile } from './ProfileContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

// --- HELPER FUNCTIONS ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const STORAGE_KEY = 'oneDayHealthData';

// --- INITIAL STATE LOADER ---
const loadStateFromStorage = () => {
    try {
        const storedState = sessionStorage.getItem(STORAGE_KEY);
        if (storedState) {
            return JSON.parse(storedState);
        }
    } catch (e) {
        console.error("Failed to parse state from sessionStorage", e);
    }
    return { meals: {}, pedometer: {} }; // Default structure
};

// Helper to get initial date from sessionStorage or default to today
const getInitialDate = () => {
    try {
        const storedDate = sessionStorage.getItem('selectedDate');
        if (storedDate) {
            return storedDate;
        }
    } catch (e) {
        console.error("Failed to load selectedDate from sessionStorage", e);
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    while (currentDate <= end) {
        dates.push(new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

export const DataProvider = ({ children }) => {
    const { profile } = useProfile();
    const userId = profile?.userId;

    const [selectedDate, setSelectedDate] = useState(getInitialDate);
    
    const [mealsByDate, setMealsByDate] = useState(() => loadStateFromStorage().meals);
    const [pedometerDataByDate, setPedometerDataByDate] = useState(() => loadStateFromStorage().pedometer);
    const [dietTotals, setDietTotals] = useState({ calories: 0, carbs: 0, protein: 0, fat: 0 });
    const [activeDateRange, setActiveDateRange] = useState({
        startDate: getInitialDate(), // Should match initial default of CollectionView (7 days ago to today)
        endDate: getInitialDate() // Will be updated by CollectionView
    });
    
    // --- DEBOUNCED SAVE FUNCTIONS ---
    const debouncedSaveApiMealsRef = useRef(debounce((date, cards) => saveMeals(date, cards), 500)); // Reduced debounce time for faster saves
    const debouncedSaveApiPedometerRef = useRef(debounce((date, pData) => savePedometerData(date, pData), 500));
    const debouncedSaveToStorageRef = useRef(debounce((data) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save state to sessionStorage", e);
        }
    }, 500));

    // --- UNLOAD SAVER ---
    useEffect(() => {
        const handleBeforeUnload = () => {
            const currentMealCards = mealsByDate[selectedDate] || [];
            if (currentMealCards.length > 0) {
                // Try synchronous-ish save or beacon
                const payload = JSON.stringify({ userId, date: selectedDate, mealCards: currentMealCards });
                try {
                    navigator.sendBeacon(`${process.env.REACT_APP_API_URL}/api/meals`, new Blob([payload], { type: 'application/json' }));
                } catch(e) {
                     fetch(`${process.env.REACT_APP_API_URL}/api/meals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
                }
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [userId, selectedDate, mealsByDate]);

    // --- SAVE SELECTED DATE EFFECT ---
    useEffect(() => {
        try {
            sessionStorage.setItem('selectedDate', selectedDate);
        } catch (e) {
            console.error("Failed to save selectedDate to sessionStorage", e);
        }
    }, [selectedDate]);

    // --- API FUNCTIONS ---
    async function saveMeals(dateToSave, mealCardsToSave) {
        if (!userId || !dateToSave || !mealCardsToSave) return;
        // Removed the check that prevented saving empty meals, so deletions can be saved properly
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/meals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, date: dateToSave, mealCards: mealCardsToSave }),
            });
        } catch (error) { console.error(`Error saving meals for date ${dateToSave}:`, error); }
    }

    async function savePedometerData(dateToSave, pedometerData) {
        if (!userId || !dateToSave || pedometerData === undefined) return;
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/pedometer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, date: dateToSave, ...pedometerData }),
            });
        } catch (error) { console.error(`Error saving pedometer data for date ${dateToSave}:`, error); }
    }

    // --- DATA FETCHING EFFECT ---
    useEffect(() => {
        const fetchCurrentRangeData = () => {
            if (!userId || !activeDateRange.startDate || !activeDateRange.endDate) return;

            const datesToFetch = getDatesInRange(activeDateRange.startDate, activeDateRange.endDate);

            datesToFetch.forEach(date => {
                // Fetch meals for each date in range if not already loaded or on focus
                fetch(`${process.env.REACT_APP_API_URL}/api/meals/${userId}/${date}`)
                    .then(res => res.json())
                    .then(data => setMealsByDate(prev => ({ ...prev, [date]: data || [] })))
                    .catch(error => {
                        console.error(`Error fetching meals for ${date}:`, error);
                    });

                // Fetch pedometer data for each date in range if not already loaded or on focus
                fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/steps/${userId}/${date}`)
                    .then(res => res.json())
                    .then(data => setPedometerDataByDate(prev => ({ ...prev, [date]: { steps: data.steps || 0, weight: data.weight || 0 } })))
                    .catch(error => {
                        console.error(`Error fetching pedometer data for ${date}:`, error);
                    });
            });
        };

        // Fetch immediately
        fetchCurrentRangeData();

        // Refetch on window focus to get latest background saves
        const handleFocus = () => {
            fetchCurrentRangeData();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [userId, activeDateRange]); // Removed mealsByDate, pedometerDataByDate to avoid infinite loops on state updates when fetching

    // --- SAVE TO STORAGE EFFECT ---
    useEffect(() => {
        debouncedSaveToStorageRef.current({
            meals: mealsByDate,
            pedometer: pedometerDataByDate
        });
    }, [mealsByDate, pedometerDataByDate]);

    // --- CALCULATION & API SAVE EFFECTS ---
    useEffect(() => {
        const currentMealCards = mealsByDate[selectedDate] || [];
        const totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };
        currentMealCards.forEach(card => {
            (card.foods || []).forEach(food => {
                totals.calories += (food.calories || 0) * (food.qty || 1);
                totals.carbs += (food.carbs || 0) * (food.qty || 1);
                totals.protein += (food.protein || 0) * (food.qty || 1);
                totals.fat += (food.fat || 0) * (food.qty || 1);
            });
        });
        setDietTotals(totals);
        debouncedSaveApiMealsRef.current(selectedDate, currentMealCards);
    }, [mealsByDate, selectedDate]);

    useEffect(() => {
        const currentPedometerData = pedometerDataByDate[selectedDate];
        if (currentPedometerData !== undefined) {
            debouncedSaveApiPedometerRef.current(selectedDate, currentPedometerData);
        }
    }, [pedometerDataByDate, selectedDate]);

    // --- HANDLER FUNCTIONS ---
    const updateMealCardsForSelectedDate = (newMealCards) => {
        setMealsByDate(prev => ({ ...prev, [selectedDate]: newMealCards }));
    };

    const updateCurrentMeals = (updateFn) => setMealsByDate(prev => ({ ...prev, [selectedDate]: updateFn(prev[selectedDate] || []) }));
    const updateSteps = (newSteps) => setPedometerDataByDate(prev => ({ ...prev, [selectedDate]: { ...prev[selectedDate], steps: newSteps } }));
    const updateWeight = (newWeight) => setPedometerDataByDate(prev => ({ ...prev, [selectedDate]: { ...prev[selectedDate], weight: newWeight } }));
    const addMealCard = () => updateCurrentMeals(cards => [...cards, { id: Date.now(), category: '', foods: [], searchQuery: '' }]);
    const handleCategoryChange = (cardId, newCategory) => updateCurrentMeals(cards => cards.map(card => card.id === cardId ? { ...card, category: newCategory } : card));
    const deleteMealCard = (cardId) => updateCurrentMeals(cards => cards.filter(card => card.id !== cardId));
    const removeFoodFromCard = (cardId, foodId) => updateCurrentMeals(cards => cards.map(card => card.id === cardId ? { ...card, foods: card.foods.filter(f => f.id !== foodId) } : card));
    const updateFoodQty = (cardId, foodId, qty) => updateCurrentMeals(cards => cards.map(card => card.id === cardId ? { ...card, foods: card.foods.map(f => f.id === foodId ? { ...f, qty: qty } : f) } : card));
    const addFoodToCard = (cardId, food) => updateCurrentMeals(cards => cards.map(card => card.id === cardId ? { ...card, foods: [...card.foods, { ...food, qty: 1, id: Date.now() }], searchQuery: '' } : card));
    const setSearchQuery = (cardId, query) => updateCurrentMeals(cards => cards.map(card => card.id === cardId ? { ...card, searchQuery: query } : card));

    // --- CONTEXT VALUE ---
    const value = {
        selectedDate, setSelectedDate,
        mealsByDate,
        pedometerDataByDate,
        mealCards: mealsByDate[selectedDate] || [],
        dietTotals,
        steps: pedometerDataByDate[selectedDate]?.steps || 0,
        weight: pedometerDataByDate[selectedDate]?.weight || 0,
        updateSteps,
        updateWeight,
        addMealCard, deleteMealCard, handleCategoryChange,
        addFoodToCard, removeFoodFromCard, updateFoodQty, setSearchQuery, setMealCards: updateMealCardsForSelectedDate,
        activeDateRange, setActiveDateRange
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
