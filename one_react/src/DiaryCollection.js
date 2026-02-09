import React, { useState, useEffect, useMemo } from 'react';
import './DiaryCollection.css';
// import { useNavigate } from 'react-router-dom'; // Removed as back button is removed

import { useProfile } from './ProfileContext'; // Import useProfile
// import IllustratedCalendarIcon from './IllustratedCalendarIcon'; // Removed as calendar icon is removed

const DiaryCollection = ({ selectedStartDate, selectedEndDate }) => {
    const [allDiaries, setAllDiaries] = useState([]);
    // const navigate = useNavigate(); // Removed
    const { profile } = useProfile(); // Get profile from context

    useEffect(() => {
        const fetchDiaries = async () => {
            if (!profile.userId) return; // Wait for userId to be available
            console.log("Fetching diaries for userId:", profile.userId, "and selectedDate range."); // DEBUG
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/diaries/${profile.userId}`, {
                    cache: 'no-store' // Add this to prevent browser caching
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                console.log("DiaryCollection raw data from API:", data); // DEBUG
                const formattedData = data.map(diary => ({
                    ...diary,
                    navDate: new Date(diary.date).toISOString().split('T')[0],
                    displayDate: `${String(new Date(diary.date).getMonth() + 1).padStart(2, '0')}/${String(new Date(diary.date).getDate()).padStart(2, '0')}`,
                    image: diary.canvasImagePath ? `${process.env.REACT_APP_API_URL}${diary.canvasImagePath}` : null,
                }));
                console.log("DiaryCollection formattedData with image path:", formattedData); // DEBUG
                setAllDiaries(formattedData);
            } catch (error) {
                console.error('Failed to fetch diaries:', error);
            }
        };

        fetchDiaries();

        const handleFocus = () => {
            fetchDiaries();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [profile.userId]); // Re-run effect when userId changes

    const displayedDiaries = useMemo(() => {
        return allDiaries.filter(diary => {
            const diaryDate = new Date(diary.navDate);
            const start = new Date(selectedStartDate);
            const end = new Date(selectedEndDate);

            return diaryDate >= start && diaryDate <= end;
        });
    }, [allDiaries, selectedStartDate, selectedEndDate]);


    const handleCardClick = (id) => {
        // navigate(`/diary-view/id/${id}`); // Navigation will be handled by CollectionView or parent
    };

    // const handleGoBack = () => { // Removed
    //     navigate(-1);
    // };



        const renderDiaryCard = (diary) => {
            // Truncate title
            const displayTitle = diary.title && diary.title.length > 10
                ? diary.title.substring(0, 10) + '...'
                : diary.title || '제목 없음';
    
            // Truncate content for preview
            const displayPreview = diary.content && diary.content.length > 50 // Example truncation
                ? diary.content.substring(0, 50) + '...'
                : diary.content || '내용 없음';
    
    
            return (
                <div key={diary.id} className="diary-card" onClick={() => handleCardClick(diary.id)}>
                    {diary.image && (
                        <img src={diary.image} alt="Diary Canvas" className="diary-card-image-thumbnail" />
                    )}
                    <div className="diary-card-header">
                        <span className="card-date-display">{diary.displayDate}</span>
                        <span className="diary-title-display">{displayTitle}</span>
                    </div>
                    <div className="diary-preview-content">{displayPreview}</div>
                </div>
            );
        };
    return (
        <div className="diary-collection-container">
                        {/* Removed header, back button, title, and calendar icon */}




            {displayedDiaries.length > 0 ? (
                <div className="diary-grid">
                    {displayedDiaries.map(renderDiaryCard)}
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className="empty-data-card">
                        저장된 다이어리 데이터가 없습니다.
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiaryCollection;
