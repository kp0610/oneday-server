import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HexColorPicker } from "react-colorful"; // Import HexColorPicker
import { LuPen, LuEraser, LuType, LuImage, LuUndo, LuRedo } from 'react-icons/lu'; // Import Lucide Icons
import './Diary.css'; // Import the new CSS file

const Diary = ({ selectedDate, userId }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingTool, setDrawingTool] = useState('pen');
    const [penColor, setPenColor] = useState('black');
    const [penSize, setPenSize] = useState(8);
    const [textSize, setTextSize] = useState(16); // New state for text size
    const [showMoreColors, setShowMoreColors] = useState(false);
    
    const moreColorsBtnRef = useRef(null); // Ref for the '+' button
    const expandedColorPaletteRef = useRef(null); // Ref for the expanded color palette

    // Effect to close expanded color palette on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showMoreColors &&
                expandedColorPaletteRef.current &&
                !expandedColorPaletteRef.current.contains(event.target) &&
                moreColorsBtnRef.current &&
                !moreColorsBtnRef.current.contains(event.target)
            ) {
                setShowMoreColors(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMoreColors]);
    
    const [texts, setTexts] = useState([]);
    const textRefs = useRef({});
    const [editingText, setEditingText] = useState(null);
    const textareaRef = useRef(null); // Ref for the active textarea

    useEffect(() => {
        if (editingText && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current.focus();
            }, 0);
        }
    }, [editingText]);
    
    const [images, setImages] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); // { type: 'text' | 'image', id }
    const [draggingItem, setDraggingItem] = useState(null); // { type: 'text' | 'image', id }
    const [resizingImage, setResizingImage] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const containerRef = useRef(null); // Ref for the canvas's parent container

    // Effect to adjust canvas dimensions to its container's size
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const adjustCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1; // Get device pixel ratio

            // Set canvas drawing buffer size to its actual rendered size, scaled by DPR
            canvas.width = container.clientWidth * dpr;
            canvas.height = container.clientHeight * dpr;

            // Scale down the context to match the CSS size, effectively making strokes and text sharper
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            // Restore drawing if any after resizing
            if (historyStep >= 0 && history[historyStep]) { // Check if history[historyStep] exists
                restoreState(history[historyStep]);
            } else if (historyStep === -1) { // If no history, just clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear scaled context
            }
        };

        // Adjust initially and on window resize
        adjustCanvasSize();
        window.addEventListener('resize', adjustCanvasSize);

        return () => {
            window.removeEventListener('resize', adjustCanvasSize);
        };
    }, []); // Removed history dependencies to prevent canvas reset on every history change

    const pushToHistory = (currentState = { texts, images, canvasData: canvasRef.current.toDataURL() }) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(currentState);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const restoreState = (state) => {
        const { canvasData, texts: newTexts, images: newImages } = state;
        setTexts(newTexts || []);
        setImages(newImages || []);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image to fill canvas
        };
        img.src = canvasData;
    };

    useEffect(() => {
        const fetchDiary = async () => {
            if (!userId || !selectedDate) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/diaries/${userId}/${selectedDate}`);
                const data = await res.json();
                
                const loadedTexts = data?.texts || [];
                const loadedImages = data?.images || [];
                setTexts(loadedTexts);
                setImages(loadedImages);
                setTitle(data?.title || '');

                if (data?.canvasImagePath) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous'; // Handle potential CORS issues
                    img.onload = () => {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the dpr-scaled canvas

                        const sourceWidth = img.width;
                        const sourceHeight = img.height;
                        const dpr = window.devicePixelRatio || 1;

                        // Calculate draw dimensions for the *display* size first
                        const canvasCssWidth = canvas.clientWidth;
                        const canvasCssHeight = canvas.clientHeight;

                        const aspectRatio = sourceWidth / sourceHeight;

                        let drawCssWidth = canvasCssWidth;
                        let drawCssHeight = canvasCssWidth / aspectRatio;

                        if (drawCssHeight > canvasCssHeight) {
                            drawCssHeight = canvasCssHeight;
                            drawCssWidth = canvasCssHeight * aspectRatio;
                        }

                        // Center the image within the canvas
                        const drawX = (canvasCssWidth - drawCssWidth) / 2;
                        const drawY = (canvasCssHeight - drawCssHeight) / 2;


                        // Now, draw onto the dpr-scaled canvas context using the calculated CSS dimensions
                        // multiplied by dpr to get the correct drawing buffer coordinates.
                        ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight, // Source image (entire image)
                            drawX, drawY,                                          // Destination x, y on canvas
                            drawCssWidth, drawCssHeight);                  // Destination width, height on canvas (already scaled by ctx.scale(dpr, dpr))

                        const initialState = { canvasData: canvas.toDataURL(), texts: loadedTexts, images: loadedImages };
                        setHistory([initialState]);
                        setHistoryStep(0);
                    };
                    img.src = `${process.env.REACT_APP_API_URL}${data.canvasImagePath}`;
                } else {
                    const initialState = { canvasData: canvas.toDataURL(), texts: loadedTexts, images: loadedImages };
                    setHistory([initialState]);
                    setHistoryStep(0);
                }
            } catch (error) {
                console.error("Error fetching diary:", error);
                const initialState = { canvasData: canvas.toDataURL(), texts: [], images: [] };
                setHistory([initialState]);
                setHistoryStep(0);
            }
        };

        fetchDiary();
    }, [selectedDate, userId]);

    const saveDiary = async () => {
        if (!userId) {
            alert('로그인이 필요합니다.');
            return;
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Get the current CSS display dimensions of the canvas wrapper
        const container = containerRef.current;
        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight;

        // Create a temporary canvas at the display resolution
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = displayWidth;
        finalCanvas.height = displayHeight;
        const finalCtx = finalCanvas.getContext('2d');

        let initialCanvasBase64 = null;
        if (historyStep >= 0 && history[historyStep]) {
            initialCanvasBase64 = history[historyStep].canvasData;
        } else {
            initialCanvasBase64 = canvas.toDataURL();
        }

        if (initialCanvasBase64) {
            const tempImg = new Image();
            tempImg.src = initialCanvasBase64;
            await new Promise(resolve => tempImg.onload = resolve);

            const sourceWidth = tempImg.width;
            const sourceHeight = tempImg.height;

            const aspectRatio = sourceWidth / sourceHeight;
            let drawWidth = displayWidth;
            let drawHeight = displayWidth / aspectRatio;

            if (drawHeight > displayHeight) {
                drawHeight = displayHeight;
                drawWidth = displayHeight * aspectRatio;
            }
            // Center the image if it doesn't fill the entire canvas
            const drawX = (displayWidth - drawWidth) / 2;
            const drawY = (displayHeight - drawHeight) / 2;

            finalCtx.drawImage(tempImg, 0, 0, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
        }

        const imageLoadPromises = images.map(image => {
            return new Promise(resolve => {
                const img = new Image();
                img.src = image.src;
                img.onload = () => {
                    finalCtx.drawImage(img, image.x, image.y, image.width, image.height);
                    resolve();
                };
                img.onerror = () => resolve();
            });
        });

        await Promise.all(imageLoadPromises);

        texts.forEach(text => {
            finalCtx.font = `${text.size}px sans-serif`;
            finalCtx.fillStyle = text.color || 'black';
            finalCtx.fillText(text.value, text.x, text.y);
        });

        const canvasData = finalCanvas.toDataURL('image/png');
        const diaryData = {
            userId,
            date: selectedDate,
            title,
            canvasData,
        };

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/diaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(diaryData),
            });
            if (res.ok) {
                alert('다이어리가 저장되었습니다.');
            } else {
                alert('저장에 실패했습니다.');
            }
        } catch (error) {
            console.error("Error saving diary:", error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };
    
    const undo = () => {
        if (historyStep > 0) {
            const newHistoryStep = historyStep - 1;
            setHistoryStep(newHistoryStep);
            restoreState(history[newHistoryStep]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const newHistoryStep = historyStep + 1;
            setHistoryStep(newHistoryStep);
            restoreState(history[newHistoryStep]);
        }
    };

    const startEditingText = (id) => {
        setSelectedItem({ type: 'text', id });
        setEditingText(id);
    };

    const handleCanvasMouseDown = ({ nativeEvent }) => {
        setSelectedItem(null);
        if (drawingTool === 'text') {
            if(editingText) {
                setEditingText(null);
                return;
            }
            // Add text on single click
            const { offsetX, offsetY } = nativeEvent;
            const newText = { id: Date.now(), x: offsetX, y: offsetY, value: '', color: penColor, size: textSize };
            const newTexts = [...texts, newText];
            setTexts(newTexts);
            startEditingText(newText.id);
            pushToHistory({ texts: newTexts, images, canvasData: canvasRef.current.toDataURL() });
            return;
        }
        const { offsetX, offsetY } = nativeEvent;
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const handleCanvasDoubleClick = ({ nativeEvent }) => {
        // Double-click text addition removed as it's now handled by single-click in handleCanvasMouseDown
    };
    
    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        if (drawingTool === 'eraser') {
            // This part is complex and might be revisited. For now, it erases canvas content.
        }
        
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = penColor;
        ctx.lineWidth = drawingTool === 'eraser' ? penSize * 2 : penSize;
        ctx.globalCompositeOperation = drawingTool === 'pen' ? 'source-over' : 'destination-out';
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.closePath();
            setIsDrawing(false);
            pushToHistory();
        }
    };

    // Text handlers
    const handleTextChange = (id, value) => {
        const newTexts = texts.map(t => t.id === id ? { ...t, value } : t);
        setTexts(newTexts);
    };

    const handleTextBlur = () => {
        const textToEdit = texts.find(t => t.id === editingText);
        if (textToEdit && textToEdit.value.trim() === '') {
             const newTexts = texts.filter(t => t.id !== editingText);
             setTexts(newTexts);
             pushToHistory({ texts: newTexts, images, canvasData: canvasRef.current.toDataURL() });
        } else {
            pushToHistory();
        }
        setEditingText(null);
    };
    
    const deleteText = (id) => {
        const newTexts = texts.filter(t => t.id !== id);
        setTexts(newTexts);
        pushToHistory({ texts: newTexts, images, canvasData: canvasRef.current.toDataURL() });
    };

    // Image handlers
    const deleteImage = (id) => {
        const newImages = images.filter(img => img.id !== id);
        setImages(newImages);
        pushToHistory({ texts, images: newImages, canvasData: canvasRef.current.toDataURL() });
    };
    
    const handleImageUpload = (e) => {
        if (!e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const MAX_WIDTH = canvas.width * 0.5;
                const MAX_HEIGHT = canvas.height * 0.5;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                const newImage = { id: Date.now(), src: img.src, x: 0, y: 0, width, height, ratio: width / height };
                const newImages = [...images, newImage];
                setImages(newImages);
                pushToHistory({ texts, images: newImages, canvasData: canvasRef.current.toDataURL() });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    // Drag and Resize Handlers
    const handleItemDragStart = (type, id, e) => {
        e.stopPropagation();
        setSelectedItem({ type, id });
        setDraggingItem({ type, id });
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleImageResizeStart = (id, e) => {
        e.stopPropagation();
        setResizingImage(id);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (draggingItem) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            if (draggingItem.type === 'text') {
                setTexts(texts.map(t => t.id === draggingItem.id ? { ...t, x: t.x + dx, y: t.y + dy } : t));
            } else if (draggingItem.type === 'image') {
                setImages(images.map(img => img.id === draggingItem.id ? { ...img, x: img.x + dx, y: img.y + dy } : img));
            }
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (resizingImage) {
            const dx = e.clientX - dragStart.x;
            setImages(images.map(img => {
                if (img.id === resizingImage) {
                    const newWidth = img.width + dx;
                    return { ...img, width: newWidth, height: newWidth / img.ratio };
                }
                return img;
            }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if(isDrawing) {
            draw(e);
        }
    };

    const handleMouseUp = () => {
        if (draggingItem || resizingImage) {
            pushToHistory();
        }
        setDraggingItem(null);
        setResizingImage(null);
        stopDrawing();
    };

    return (
        <div id="diary-content" className="diary-page-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="dashboard-section">
                
                <div id="diary-editor" className="diary-editor-container">
                    <input type="text" id="diary-title" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <div className="diary-toolbar">
                        <div className="drawing-tools">
                            <div className="tool-buttons">
                                <button className={`tool-btn ${drawingTool === 'pen' ? 'active' : ''}`} onClick={() => setDrawingTool('pen')}><LuPen /></button>
                                <button className={`tool-btn ${drawingTool === 'eraser' ? 'active' : ''}`} onClick={() => setDrawingTool('eraser')}><LuEraser /></button>
                                <button className={`tool-btn ${drawingTool === 'text' ? 'active' : ''}`} onClick={() => setDrawingTool('text')}><LuType /></button>
                                <label className="tool-btn" htmlFor="image-upload-input"><LuImage />
                                    <input type="file" id="image-upload-input" accept="image/*" className="hidden-input" onChange={handleImageUpload} />
                                </label>
                                <button className="tool-btn" onClick={undo} disabled={historyStep <= 0}><LuUndo /></button>
                                <button className="tool-btn" onClick={redo} disabled={historyStep >= history.length - 1}><LuRedo /></button>
                            </div>
                            <div className="color-palette-wrapper">
                                <div className="color-palette">
                                    <div className={`color-box ${penColor === 'black' ? 'active' : ''}`} style={{backgroundColor: 'black'}} data-color="black" onClick={() => setPenColor('black')}></div>
                                    <div className={`color-box ${penColor === '#3D5BDF' ? 'active' : ''}`} style={{backgroundColor: '#3D5BDF'}} data-color="#3D5BDF" onClick={() => setPenColor('#3D5BDF')}></div>
                                    <div className="color-box current-selected-color-indicator" style={{backgroundColor: penColor}} onClick={() => setShowMoreColors(true)}></div>
                                    <div ref={moreColorsBtnRef} className="color-box more-colors-btn" onClick={() => setShowMoreColors(!showMoreColors)}>+</div>
                                </div>
                            </div>
                            <div className="size-controls">
                                {(drawingTool === 'pen' || drawingTool === 'eraser') && (
                                    <>
                                        <input
                                            type="number"
                                            value={penSize}
                                            onChange={(e) => setPenSize(parseInt(e.target.value) || 1)}
                                            min="1"
                                            max="50"
                                            className="size-input"
                                        />
                                        <span className="size-label">px</span>
                                    </>
                                )}
                                {drawingTool === 'text' && (
                                    <>
                                        <input
                                            type="number"
                                            value={textSize}
                                            onChange={(e) => setTextSize(parseInt(e.target.value) || 1)}
                                            min="1"
                                            max="72"
                                            className="size-input"
                                        />
                                        <span className="size-label">px</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {showMoreColors && ( // Moved outside of diary-toolbar
                        <div ref={expandedColorPaletteRef} className="expanded-color-palette">
                            <HexColorPicker color={penColor} onChange={setPenColor} />
                        </div>
                    )}
                    <div ref={containerRef} className="canvas-wrapper">
                        <button className="save-btn" onClick={saveDiary}>저장</button> {/* Moved save button here */}
                        <canvas
                            id="diary-canvas"
                            ref={canvasRef}
                            className={`${drawingTool}-tool`} // Add tool-specific class
                            // width and height are now managed by useEffect
                            onMouseDown={handleCanvasMouseDown}
                            onDoubleClick={handleCanvasDoubleClick}
                            style={{ display: 'block' }} // Prevent extra space below canvas
                        ></canvas>
                        {/* Render Images */}
                        {images.map(image => {
                            const isSelected = selectedItem?.type === 'image' && selectedItem?.id === image.id;
                            return (
                                <div
                                    key={image.id}
                                    className={`resizable-image-wrapper ${isSelected ? 'selected' : ''}`}
                                    style={{
                                        top: image.y,
                                        left: image.x,
                                        width: image.width,
                                        height: image.height,
                                    }}
                                    onMouseDown={(e) => handleItemDragStart('image', image.id, e)}
                                >
                                    <img src={image.src} alt="" style={{ width: '100%', height: '100%' }} />
                                    {isSelected && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); deleteImage(image.id); }} className="item-action-btn delete">&times;</button>
                                            <div onMouseDown={(e) => handleImageResizeStart(image.id, e)} className="item-action-btn resize"></div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        {/* Render Texts */}
                        {texts.map(text => {
                             const isSelected = selectedItem?.type === 'text' && selectedItem?.id === text.id;
                             return (
                                <div
                                    key={text.id}
                                    ref={el => textRefs.current[text.id] = el}
                                    className={`diary-text-box ${isSelected ? 'selected' : ''} ${editingText === text.id ? 'editing' : ''}`}
                                    style={{ top: text.y, left: text.x, color: text.color || 'black', fontSize: `${text.size}px` }} // Use text.size
                                    onMouseDown={(e) => handleItemDragStart('text', text.id, e)}
                                    onDoubleClick={(e) => { e.stopPropagation(); startEditingText(text.id); }}
                                >
                                    {isSelected && editingText !== text.id && (
                                         <button onClick={(e) => { e.stopPropagation(); deleteText(text.id); }} className="item-action-btn delete">&times;</button>
                                    )}
                                    {editingText === text.id ? (
                                        <textarea
                                            ref={textareaRef}
                                            value={text.value}
                                            onChange={(e) => handleTextChange(text.id, e.target.value)}
                                            onBlur={handleTextBlur}
                                            className="diary-textarea-input"
                                            style={{ color: text.color || 'black', fontSize: `${text.size}px` }} // Use text.size
                                        />
                                     ) : (
                                        <div className="diary-display-text" style={{ fontSize: `${text.size}px` }}>{text.value}</div> // Use text.size
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Diary;