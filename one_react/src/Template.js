import React, { useState, useEffect, useRef } from 'react'; // Import useRef

const truncateTitle = (title) => {
    if (title.length > 5) {
        return title.substring(0, 5) + '···';
    }
    return title;
};

const Template = ({ type, templates = [], onTemplateClick, getTemplateStyle, onTemplateDeleteClick }) => {
    const [pressTimer, setPressTimer] = useState(null);
    const [activeTemplateId, setActiveTemplateId] = useState(null); // To track which template is long-pressed
    const [longPressHandled, setLongPressHandled] = useState(false); // New state
    const templateRefs = useRef({}); // To store refs for each template button

    const handlePressStart = (templateId, e) => {
        if (e.type === 'touchstart') {
            e.preventDefault();
        }
        // Clear any existing timer to prevent multiple timers
        clearTimeout(pressTimer);
        setLongPressHandled(false); // Reset flag
        setPressTimer(setTimeout(() => {
            setActiveTemplateId(templateId);
            setLongPressHandled(true); // Set flag when long-press is detected
        }, 2000)); // 2 seconds
    };

    const handlePressEnd = () => {
        clearTimeout(pressTimer);
        // setActiveTemplateId(null); // Don't hide immediately, let user click 'x' or click elsewhere
    };

    // Effect to handle clicks outside the active template to hide the 'x' button
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeTemplateId && templateRefs.current[activeTemplateId] &&
                !templateRefs.current[activeTemplateId].contains(event.target)) {
                setActiveTemplateId(null); // Hide 'x' button
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeTemplateId]); // Re-run when activeTemplateId changes

    return (
        <div className="template-bar">
            {templates.length === 0 ? (
                <p className="empty-template-message">템플릿을 추가해보세요.</p>
            ) : (
                templates.map(template => (
                    <button
                        key={template.id}
                        ref={el => templateRefs.current[template.id] = el} // Assign ref
                        className="template-btn template-tag"
                        style={getTemplateStyle(template)}
                        onClick={(e) => {
                            if (longPressHandled) { // If a long-press just occurred
                                e.preventDefault(); // Prevent default click behavior
                                setLongPressHandled(false); // Reset flag
                                // Do not hide 'x' here, let the global click listener handle it or a subsequent click
                            } else if (activeTemplateId === template.id) {
                                // If 'x' is visible, a normal click on the tag should hide it
                                setActiveTemplateId(null);
                            } else {
                                onTemplateClick(template); // Normal click behavior
                            }
                        }}
                        onMouseDown={(e) => handlePressStart(template.id, e)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={(e) => handlePressStart(template.id, e)}
                        onTouchEnd={handlePressEnd}
                        onTouchCancel={handlePressEnd}
                    >
                        {truncateTitle(template.title)}
                        {activeTemplateId === template.id && ( // Conditionally render 'x'
                            <span
                                className="delete-template-btn"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering onTemplateClick
                                    onTemplateDeleteClick(template);
                                    setActiveTemplateId(null); // Hide 'x' after deletion attempt
                                }}
                            >
                                &times; {/* 'x' character */}
                            </span>
                        )}
                    </button>
                ))
            )}
        </div>
    );
};

export default Template;
