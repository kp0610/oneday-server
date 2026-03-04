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
    const textsRef = useRef(texts);
    const imagesRef = useRef(images);
    useEffect(() => { textsRef.current = texts; }, [texts]);
    useEffect(() => { imagesRef.current = images; }, [images]);
    const [selectedItem, setSelectedItem] = useState(null); // { type: 'text' | 'image', id }
    const [draggingItem, setDraggingItem] = useState(null); // { type: 'text' | 'image', id }
    const [resizingImage, setResizingImage] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const longPressTimerRef = useRef(null);
    const startPosRef = useRef({ x: 0, y: 0 });
    const isLongPressTriggeredRef = useRef(false);

    const [backgroundImageSrc, setBackgroundImageSrc] = useState(null);
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

    const pushToHistory = (currentState) => {
        const stateToSave = currentState || { texts: textsRef.current, images: imagesRef.current, canvasData: canvasRef.current.toDataURL() };
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(stateToSave);
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
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr); // Draw image to fill canvas, adjusted for DPR
        };
        img.src = canvasData;
    };

    useEffect(() => {
        const fetchDiary = async () => {
            if (!userId || !selectedDate) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setBackgroundImageSrc(null);
            
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/diaries/${userId}/${selectedDate}`);
                const data = await res.json();
                
                const loadedTexts = data?.texts || [];
                const loadedImages = data?.images || [];
                setTexts(loadedTexts);
                setImages(loadedImages);
                setTitle(data?.title || '');

                if (data?.canvasImagePath) {
                    setBackgroundImageSrc(`${process.env.REACT_APP_API_URL}${data.canvasImagePath}`);
                    const initialState = { canvasData: canvas.toDataURL(), texts: loadedTexts, images: loadedImages };
                    setHistory([initialState]);
                    setHistoryStep(0);
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
        const dpr = window.devicePixelRatio || 1;

        // Create a temporary canvas at the high resolution
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = displayWidth * dpr;
        finalCanvas.height = displayHeight * dpr;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.scale(dpr, dpr);

        // 1. Draw background image
        if (backgroundImageSrc) {
            const bgImg = new Image();
            bgImg.crossOrigin = 'anonymous';
            bgImg.src = backgroundImageSrc;
            await new Promise(resolve => bgImg.onload = resolve);
            
            const sourceWidth = bgImg.width;
            const sourceHeight = bgImg.height;
            const aspectRatio = sourceWidth / sourceHeight;
            let drawWidth = displayWidth;
            let drawHeight = displayWidth / aspectRatio;

            if (drawHeight > displayHeight) {
                drawHeight = displayHeight;
                drawWidth = displayHeight * aspectRatio;
            }
            const drawX = (displayWidth - drawWidth) / 2;
            const drawY = (displayHeight - drawHeight) / 2;
            finalCtx.drawImage(bgImg, 0, 0, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
        }

        // 2. Draw images (DOM images)
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

        // 3. Draw strokes (canvas.toDataURL)
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
            finalCtx.drawImage(tempImg, 0, 0, displayWidth, displayHeight); // Stroke canvas is already exact size
        }

        // 4. Draw texts
        texts.forEach(text => {
            finalCtx.font = `${parseInt(text.size) || 16}px sans-serif`;
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

    const handleCanvasMouseDown = ({ nativeEvent, clientX, clientY }) => {
        if (drawingTool === 'text') {
            setSelectedItem(null);
            return; // Handled by container wrapper now
        }
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        // Calculate the scale to adjust for CSS transform: scale()
        const scaleX = canvas.offsetWidth ? rect.width / canvas.offsetWidth : 1;
        const scaleY = canvas.offsetHeight ? rect.height / canvas.offsetHeight : 1;
        
        // Use clientX/Y and un-scale them for accurate canvas coordinates
        const offsetX = (clientX - rect.left) / scaleX;
        const offsetY = (clientY - rect.top) / scaleY;

        // Find back-layer image under cursor
        const backImage = images.slice().reverse().find(img => 
            img.isTopLayer === false && 
            offsetX >= img.x && offsetX <= img.x + img.width &&
            offsetY >= img.y && offsetY <= img.y + img.height
        );

        if (backImage) {
            // Select it immediately so it can be moved or deleted
            setSelectedItem({ type: 'image', id: backImage.id });
            setDraggingItem({ type: 'image', id: backImage.id });
            setDragStart({ x: clientX, y: clientY });

            startPosRef.current = { x: clientX, y: clientY };
            isLongPressTriggeredRef.current = false;
            
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;
                setIsDrawing(false);
                setDraggingItem(null); // Cancel drag if it was a long press
                
                // Clear the tiny dot that might have been drawn
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (historyStep >= 0 && history[historyStep]) {
                     const img = new Image();
                     img.onload = () => {
                         const dpr = window.devicePixelRatio || 1;
                         ctx.clearRect(0, 0, canvas.width, canvas.height);
                         ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
                     };
                     img.src = history[historyStep].canvasData;
                } else {
                     ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                toggleImageLayer(backImage.id);
            }, 300);
        } else {
            setSelectedItem(null);
        }

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
        const scaleX = canvas.offsetWidth ? rect.width / canvas.offsetWidth : 1;
        const scaleY = canvas.offsetHeight ? rect.height / canvas.offsetHeight : 1;
        const offsetX = (e.clientX - rect.left) / scaleX;
        const offsetY = (e.clientY - rect.top) / scaleY;

        if (drawingTool === 'eraser') {
            // This part is complex and might be revisited. For now, it erases canvas content.
        }
        
                const ctx = canvasRef.current.getContext('2d');
                ctx.strokeStyle = penColor;
                ctx.lineWidth = drawingTool === 'eraser' ? (parseInt(penSize) || 8) * 2 : (parseInt(penSize) || 8);
                ctx.globalCompositeOperation = drawingTool === 'pen' ? 'source-over' : 'destination-out';        ctx.lineTo(offsetX, offsetY);
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
                const MAX_WIDTH = canvas.width * 0.35;
                const MAX_HEIGHT = canvas.height * 0.35;
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
                
                const newImage = { id: Date.now(), src: img.src, x: 0, y: 0, width, height, ratio: width / height, isTopLayer: true };
                const newImages = [...images, newImage];
                setImages(newImages);
                pushToHistory({ texts, images: newImages, canvasData: canvasRef.current.toDataURL() });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
        e.target.value = ''; // Reset input value to allow re-uploading the same file
    };

    // Drag and Resize Handlers
    const toggleImageLayer = (id) => {
        let updatedImages;
        setImages(prev => {
            updatedImages = prev.map(img => {
                if (img.id === id) {
                    const currentTop = img.isTopLayer !== false; // default true
                    return { ...img, isTopLayer: !currentTop };
                }
                return img;
            });
            return updatedImages;
        });
        setTimeout(() => {
             pushToHistory({ texts: textsRef.current, images: updatedImages, canvasData: canvasRef.current.toDataURL() });
        }, 0);
    };

    const handleImageMouseDown = (id, e) => {
        e.stopPropagation();
        setSelectedItem({ type: 'image', id });
        setDraggingItem({ type: 'image', id });
        setDragStart({ x: e.clientX, y: e.clientY });
        
        startPosRef.current = { x: e.clientX, y: e.clientY };
        isLongPressTriggeredRef.current = false;
        
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        
        longPressTimerRef.current = setTimeout(() => {
            isLongPressTriggeredRef.current = true;
            setDraggingItem(null); 
            setSelectedItem(null); 
            toggleImageLayer(id);
        }, 300);
    };

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
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleMouseMove = (e) => {
        if (longPressTimerRef.current) {
            const dx = e.clientX - startPosRef.current.x;
            const dy = e.clientY - startPosRef.current.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
        }
        
        if (isLongPressTriggeredRef.current) return;

        if (draggingItem) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.offsetWidth ? rect.width / canvas.offsetWidth : 1;
            const scaleY = canvas.offsetHeight ? rect.height / canvas.offsetHeight : 1;

            const dx = (e.clientX - dragStart.x) / scaleX;
            const dy = (e.clientY - dragStart.y) / scaleY;
            if (draggingItem.type === 'text') {
                setTexts(texts.map(t => t.id === draggingItem.id ? { ...t, x: t.x + dx, y: t.y + dy } : t));
            } else if (draggingItem.type === 'image') {
                setImages(images.map(img => img.id === draggingItem.id ? { ...img, x: img.x + dx, y: img.y + dy } : img));
            }
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (resizingImage) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.offsetWidth ? rect.width / canvas.offsetWidth : 1;
            const dx = (e.clientX - dragStart.x) / scaleX;
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
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (isLongPressTriggeredRef.current) {
            isLongPressTriggeredRef.current = false;
            setDraggingItem(null);
            setResizingImage(null);
            setIsDrawing(false);
            return;
        }

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
                                            onChange={(e) => setPenSize(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
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
                                            onChange={(e) => setTextSize(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
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
                    <div ref={containerRef} className="canvas-wrapper" onMouseDown={(e) => {
                        if (drawingTool === 'text') {
                            const rect = containerRef.current.getBoundingClientRect();
                            const scaleX = containerRef.current.offsetWidth ? rect.width / containerRef.current.offsetWidth : 1;
                            const scaleY = containerRef.current.offsetHeight ? rect.height / containerRef.current.offsetHeight : 1;
                            const x = (e.clientX - rect.left) / scaleX;
                            const y = (e.clientY - rect.top) / scaleY;
                            if (editingText) {
                                setEditingText(null);
                                return;
                            }
                            const newText = { id: Date.now(), x, y, value: '', color: penColor, size: textSize };
                            const newTexts = [...texts, newText];
                            setTexts(newTexts);
                            startEditingText(newText.id);
                            pushToHistory({ texts: newTexts, images, canvasData: canvasRef.current.toDataURL() });
                        }
                    }}>
                        <button className="save-btn" onClick={saveDiary} style={{ zIndex: 100 }}>저장</button> {/* Moved save button here */}
                        
                        {backgroundImageSrc && (
                            <img src={backgroundImageSrc} alt="diary-background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', zIndex: 0 }} />
                        )}

                        <canvas
                            id="diary-canvas"
                            ref={canvasRef}
                            className={`${drawingTool}-tool`} // Add tool-specific class
                            // width and height are now managed by useEffect
                            onMouseDown={handleCanvasMouseDown}
                            onDoubleClick={handleCanvasDoubleClick}
                            style={{ 
                                display: 'block', 
                                position: 'relative', 
                                zIndex: (drawingTool === 'pen' || drawingTool === 'eraser') ? 10 : 2,
                                pointerEvents: (drawingTool === 'pen' || drawingTool === 'eraser') ? 'auto' : 'none'
                            }} 
                        ></canvas>
                        
                        {/* Render Images */}
                        {images.map(image => {
                            const isTop = image.isTopLayer !== false; // true by default
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
                                        zIndex: isSelected ? 20 : (isTop ? 15 : 5),
                                        pointerEvents: (isTop || isSelected) ? 'auto' : ((drawingTool === 'pen' || drawingTool === 'eraser') ? 'none' : 'auto')
                                    }}
                                    onMouseDown={(e) => {
                                        if (isTop || isSelected || (drawingTool !== 'pen' && drawingTool !== 'eraser')) {
                                            handleImageMouseDown(image.id, e);
                                        }
                                    }}
                                >
                                    <img src={image.src} alt="" style={{ width: '100%', height: '100%' }} draggable={false} />
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
                                    style={{ 
                                        top: text.y, 
                                        left: text.x, 
                                        color: text.color || 'black', 
                                        fontSize: `${parseInt(text.size) || 16}px`,
                                        zIndex: 15,
                                        pointerEvents: (drawingTool === 'pen' || drawingTool === 'eraser') ? 'none' : 'auto'
                                    }} 
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
                                        <div className="diary-display-text" style={{ fontSize: `${parseInt(text.size) || 16}px` }}>{text.value}</div> // Use text.size
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