import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useData } from './DataContext';
import './Diet.css'; // Import the new CSS file

function X({ onClick }) {
    return (
        <button className="delete-meal-card-btn" onClick={onClick} data-name="x" data-node-id="771:2407">
            x
        </button>
    );
}

const AutocompletePortal = ({ results, position, onSelect }) => {
    if (!results || results.length === 0 || !position) {
        return null;
    }

    const style = {
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 1100,
    };

    return createPortal(
        <div className="autocomplete-results" style={style}>
            {results.map(food => (
                <div key={food.id} className="autocomplete-item" onClick={() => onSelect(food)}>
                    {food.name} ({Math.round(food.calories)}kcal)
                </div>
            ))}
        </div>,
        document.getElementById('portal-root')
    );
};

const Diet = () => {
    const { 
        mealCards,
        addMealCard,
        deleteMealCard,
        handleCategoryChange,
        addFoodToCard,
        removeFoodFromCard,
        updateFoodQty,
        setSearchQuery,
        setMealCards // Import setMealCards
    } = useData();

    const [portalResults, setPortalResults] = useState([]);
    const [portalPosition, setPortalPosition] = useState(null);
    const [activeCardId, setActiveCardId] = useState(null);
    
    const activeSearchInputRef = useRef(null);
    const containerRef = useRef(null);

    // Effect to scroll to the end when a new card is added
    useEffect(() => {
        if (containerRef.current && mealCards.length > 0) {
            const newCardElement = containerRef.current.lastChild;
            if (newCardElement) {
                const containerWidth = containerRef.current.offsetWidth;
                const cardWidth = newCardElement.offsetWidth;
                const cardLeft = newCardElement.offsetLeft;

                const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);

                containerRef.current.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [mealCards.length]);


    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const searchFoods = useCallback(debounce(async (query) => {
        if (query.length > 0 && activeSearchInputRef.current) {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/foods?search=${encodeURIComponent(query)}`);
                const matches = await res.json();
                
                const rect = activeSearchInputRef.current.getBoundingClientRect();
                setPortalPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setPortalResults(matches);
            } catch (error) {
                console.error("Error searching food:", error);
                setPortalResults([]);
            }
        } else {
            setPortalResults([]);
        }
    }, 300), []);

    const handleSearchChange = (cardId, query) => {
        setSearchQuery(cardId, query);
        setActiveCardId(cardId);
        searchFoods(query);
    };
    
    const handleSearchFocus = (e, cardId) => {
        activeSearchInputRef.current = e.target;
        setActiveCardId(cardId);
        const card = mealCards.find(c => c.id === cardId);
        if (card && card.searchQuery) {
            handleSearchChange(cardId, card.searchQuery);
        }
    };
    
    const handleAddFood = (food) => {
        if (activeCardId) {
            addFoodToCard(activeCardId, food);
        }
        setPortalResults([]);
        setPortalPosition(null);
        if (activeSearchInputRef.current) {
            activeSearchInputRef.current.value = '';
        }
        activeSearchInputRef.current = null;
    };
    
    const handleAddMealCard = () => {
        const emptyCards = mealCards.filter(card => !card.foods || card.foods.length === 0);
        console.log("Empty cards found before cleanup:", emptyCards); // DEBUG
        
        if (emptyCards.length >= 2) {
            const firstEmptyCardId = emptyCards[0].id;
            const cardsToKeep = mealCards.filter(card => {
                const isEmpty = !card.foods || card.foods.length === 0;
                return !isEmpty || card.id === firstEmptyCardId;
            });
            console.log("Cards to keep after cleanup:", cardsToKeep); // DEBUG
            setMealCards(cardsToKeep);
            alert("비어있는 카드가 여러 개 있어 하나만 남기고 정리했습니다.");
            return;
        }

        const lastCard = mealCards[mealCards.length - 1];
        if (lastCard && (!lastCard.foods || lastCard.foods.length === 0)) {
            alert("현재 식단에 음식을 추가한 후 새 카드를 생성해주세요.");
            return;
        }

        addMealCard();
    };

    return (
        <>
            <AutocompletePortal 
                results={portalResults} 
                position={portalPosition} 
                onSelect={handleAddFood}
            />
            <div className="dashboard-section diet-dashboard-section">
                <div className="diet-section-header">
                    <h3>식단 기록</h3>
                    <div className="header-actions">

                        <button className="add-card-btn" onClick={handleAddMealCard}>+</button>
                    </div>
                </div>
                <div id="meal-cards-container" ref={containerRef} className="meal-cards-wrapper">
                    {mealCards.map((card) => (
                        <div 
                            key={card.id} 
                            className="meal-card"
                            data-node-id="661:2905" // Overall meal card div
                        >
                            <div className="meal-card-header">
                                <div className="meal-category-selector">
                                    <div className="meal-category-background"></div>
                                    <div className="meal-category-options">
                                        {['아침', '점심', '저녁', '간식'].map(category => (
                                            <span
                                                key={category}
                                                className={`meal-category-option ${card.category === category ? 'selected' : ''}`}
                                                onClick={() => handleCategoryChange(card.id, category)}
                                            >
                                                {category}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <X onClick={(e) => { e.stopPropagation(); deleteMealCard(card.id); }} />
                            </div>
                            <div className="meal-card-body" onClick={(e) => e.stopPropagation()}>
                                <ul className="food-list">
                                    {(card.foods || []).map((food) => (
                                        <li key={food.id} data-node-id="661:2912">
                                            <span className="food-name">{food.name}</span>
                                            <input 
                                                className="food-qty" type="number" value={food.qty} min="0.1" step="0.1" 
                                                onChange={(e) => updateFoodQty(card.id, food.id, e.target.value)}
                                                data-node-id="771:2394"
                                            />
                                            <span className="food-cal" data-node-id="771:2399">{Math.round((food.calories || 0) * (food.qty === '' ? 0 : (parseFloat(food.qty) || 0)))} kcal</span>
                                            <button className="remove-food-btn" onClick={() => removeFoodFromCard(card.id, food.id)}>x</button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="food-search-wrapper" data-node-id="771:2383">
                                    <input
                                        type="text"
                                        className="food-search-input"
                                        placeholder="음식 검색..."
                                        value={card.searchQuery}
                                        onFocus={(e) => handleSearchFocus(e, card.id)}
                                        onChange={(e) => handleSearchChange(card.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                            <div className="meal-card-footer">
                                <span>총: <span className="meal-card-total-calories" data-node-id="771:2385">{Math.round((card.foods || []).reduce((acc, food) => acc + (food.calories || 0) * (food.qty === '' ? 0 : (parseFloat(food.qty) || 0)), 0))}</span> kcal</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};


export default Diet;
