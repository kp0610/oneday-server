import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DiaryView.css'; 

const DiaryView = () => {
    const { id } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const [diary, setDiary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDiary = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/api/diaries/id/${id}`, {
                    cache: 'no-store'
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch diary');
                }
                const data = await res.json();
                console.log("DiaryView fetchDiary data:", data); // DEBUG
                setDiary(data);
            } catch (err) {
                console.error("Error fetching diary:", err);
                setError('다이어리를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchDiary();
    }, [id]);

    const handleGoBack = () => {
        navigate(-1);
    };

    if (loading) {
        return <div className="diary-view-container">Loading...</div>;
    }

    if (error) {
        return <div className="diary-view-container error-message">{error}</div>;
    }

    if (!diary) {
        return <div className="diary-view-container no-diary">선택된 날짜에 다이어리가 없습니다.</div>;
    }

    const displayDate = new Date(diary.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="diary-view-container">
            <header className="diary-view-header">
                <span className="diary-view-back-icon" onClick={handleGoBack}>&lt;</span>
                <h1 className="diary-view-title">{diary.title || '제목 없음'}</h1>
                <span className="diary-view-date">{displayDate}</span>
            </header>
            <div className="diary-view-content">
                {diary.canvasImagePath ? (
                    <img
                        src={`${process.env.REACT_APP_API_URL}${diary.canvasImagePath}`}
                        alt="Canvas Drawing"
                        className="diary-view-canvas-image"
                    />
                ) : (
                    <div className="no-canvas-image">저장된 다이어리 이미지가 없습니다.</div>
                )}
            </div>
        </div>
    );
};

export default DiaryView;
