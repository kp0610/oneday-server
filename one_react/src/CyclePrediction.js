import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useData } from './DataContext'; // Import useData
import { LuPencil } from 'react-icons/lu'; // Import Lucide Pencil icon
import './CyclePrediction.css';

const CyclePrediction = ({ userId, selectedCycleStartDate }) => {
    // --- Get selectedDate from Context ---
    const { selectedDate } = useData();

    // --- Component State ---
    const [cycleHistory, setCycleHistory] = useState([]);
    const [dDay, setDDay] = useState('?');
    const [predictedStartDate, setPredictedStartDate] = useState('----.--.--');
    const [predictedEndDate, setPredictedEndDate] = useState('----.--.--');
    const [showCycleModal, setShowCycleModal] = useState(false);
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');
    const [editingCycleId, setEditingCycleId] = useState(null);

    useEffect(() => {
        if (selectedCycleStartDate) {
            setStartDateInput(selectedCycleStartDate);
        }
    }, [selectedCycleStartDate]);

    // --- Data Fetching ---
    const fetchCycleHistory = async () => {
        if (!userId) return;
        try {
            // FIX: Pass the selectedDate from the context as a query parameter
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/cycles/${userId}?relativeDate=${selectedDate}`);
            const data = await res.json();
            if (res.ok && data.history) {
                setCycleHistory(data.history);
                if (data.prediction) {
                    const rawDDay = data.prediction.dDay;
                    let formattedDDay;
                    if (rawDDay > 0) {
                        formattedDDay = `D-${rawDDay}`;
                    } else if (rawDDay < 0) {
                        formattedDDay = `D+${Math.abs(rawDDay)}`;
                    } else {
                        formattedDDay = 'D-Day';
                    }
                    setDDay(formattedDDay);
                    setPredictedStartDate(data.prediction.startDate);
                    setPredictedEndDate(data.prediction.endDate);
                } else {
                    setDDay('?');
                    setPredictedStartDate('----.--.--');
                    setPredictedEndDate('----.--.--');
                }
            } else {
                // Reset on failure
                setCycleHistory([]);
                setDDay('?');
                setPredictedStartDate('----.--.--');
                setPredictedEndDate('----.--.--');
            }
        } catch (error) {
            console.error("Error fetching cycle history:", error);
            setCycleHistory([]);
            setDDay('?');
            setPredictedStartDate('----.--.--');
            setPredictedEndDate('----.--.--');
        }
    };

    // FIX: Re-fetch data whenever the selectedDate from the context changes
    useEffect(() => {
        fetchCycleHistory();
    }, [userId, selectedDate]);

    // ... (rest of the helper and handler functions remain the same)

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const resetForm = () => {
        setStartDateInput('');
        setEndDateInput('');
        setEditingCycleId(null);
    };

    const handleSaveCycleRecord = async () => {
        if (!userId) { console.warn('User not logged in. Cannot save cycle record.'); return; }
        if (!startDateInput || !endDateInput) { console.warn('Start and end dates are required.'); return; }
        if (new Date(startDateInput) > new Date(endDateInput)) { console.warn('End date cannot be earlier than start date.'); return; }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/cycles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, startDate: startDateInput, endDate: endDateInput }),
            });
            const responseData = await res.json();
            if (res.ok) {
                console.log('Cycle record added successfully.');
                resetForm();
                fetchCycleHistory();
            } else {
                console.error('Failed to add cycle record:', responseData.error || 'Unknown error');
            }
        } catch (error) {
            console.error("Error saving cycle record:", error);
            console.error('Error while adding cycle record.');
        }
    };

    const handleUpdateCycleRecord = async () => {
        if (!editingCycleId) return;
        if (!startDateInput || !endDateInput) { console.warn('Start and end dates are required for update.'); return; }
        if (new Date(startDateInput) > new Date(endDateInput)) { console.warn('End date cannot be earlier than start date for update.'); return; }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/cycles/${editingCycleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate: startDateInput, endDate: endDateInput }),
            });
            const responseData = await res.json();
            if (res.ok) {
                console.log('Cycle record updated successfully.');
                resetForm();
                fetchCycleHistory();
            } else {
                console.error('Failed to update cycle record:', responseData.error || 'Unknown error');
            }
        } catch (error) {
            console.error("Error updating cycle record:", error);
            console.error('Error while updating cycle record.');
        }
    };

    const handleEditClick = (record) => {
        setEditingCycleId(record.id);
        setStartDateInput(formatDate(record.start_date));
        setEndDateInput(formatDate(record.end_date));
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleDeleteCycle = async (cycleId) => {
        if (!cycleId) { console.warn('Invalid ID for deletion.'); return; }
        if (!window.confirm('이 기록을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/healthcare/cycles/${cycleId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                console.log('Cycle record deleted successfully.');
                fetchCycleHistory();
            } else {
                console.error('Failed to delete cycle record.');
            }
        } catch (error) {
            console.error("Error deleting cycle record:", error);
            alert('기록 삭제 중 오류가 발생했습니다.');
        }
    };

    const formatCycleDate = (dateString) => {
        if (!dateString || dateString === '----.--.--') {
            return { mmdd: '--.--', day: '---' };
        }
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const day = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        return { mmdd: `${mm}.${dd}`, day };
    };

    const { mmdd: startMMDD, day: startDay } = formatCycleDate(predictedStartDate);
    const { mmdd: endMMDD, day: endDay } = formatCycleDate(predictedEndDate);

    return (
        <>
            <div className="cycle-prediction-wrapper">
                <div className="section-header">
                    <h3>월경 예정일</h3>
                    <button className="edit-btn" onClick={() => setShowCycleModal(true)}><LuPencil /></button>
                </div>
                <div className="healthcare-content-box">
                    <div className="cycle-prediction-body">
                        <div className="cycle-dates-wrapper">
                            <div className="date-label-wrapper">
                                <p className="date-label">시작</p>
                                <div className="date-box start-date">
                                    <div className="date-info-box">
                                        <span className="date-mmdd">{startMMDD}</span>
                                        <span className="date-day">{startDay}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="date-label-wrapper">
                                <p className="date-label">종료</p>
                                <div className="date-box end-date">
                                    <div className="date-info-box">
                                        <span className="date-mmdd">{endMMDD}</span>
                                        <span className="date-day">{endDay}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="d-day-box">
                                <span className="d-day-text">{dDay}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCycleModal && createPortal(
                <div id="cycle-edit-modal">
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="schedule-modal-header">
                                <h3 className="schedule-modal-title">주기 수정</h3>
                                <button className="modal-close-btn" onClick={() => { setShowCycleModal(false); resetForm(); }}>x</button>
                            </div>
                            {cycleHistory.length < 2 && (
                                <p style={{ color: 'red', marginBottom: '15px' }}>
                                    예측을 위해 최소 2번의 주기 기록이 필요합니다.
                                </p>
                            )}
                            <div className="cycle-input-form">
                                <label htmlFor="cycle-start-date">시작일:</label>
                                <input 
                                    type="date" 
                                    id="cycle-start-date" 
                                    value={startDateInput} 
                                    onChange={(e) => setStartDateInput(e.target.value)} 
                                />
                                <label htmlFor="cycle-end-date">종료일:</label>
                                <input 
                                    type="date" 
                                    id="cycle-end-date" 
                                    value={endDateInput} 
                                    onChange={(e) => setEndDateInput(e.target.value)} 
                                />
                                {editingCycleId ? (
                                    <>
                                        <button onClick={handleUpdateCycleRecord}>기록 저장</button>
                                        <button onClick={handleCancelEdit}>취소</button>
                                    </>
                                ) : (
                                    <button onClick={handleSaveCycleRecord}>기록 추가</button>
                                )}
                            </div>
                            <hr />
                            <h4>과거 기록</h4>
                            <div id="past-cycles-list" className="section-content">
                                {cycleHistory.length > 0 ? (
                                    <ul>
                                        {cycleHistory.map(record => (
                                            <li key={record.id}>
                                                <span>{formatDate(record.start_date)} ~ {formatDate(record.end_date)}</span>
                                                <div className="record-actions">
                                                    <button className="edit-record-btn" onClick={() => handleEditClick(record)}>수정</button>
                                                    <button className="delete-record-btn" onClick={() => handleDeleteCycle(record.id)}>삭제</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>기록이 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.getElementById('portal-root')
            )}
        </>
    );
};

export default CyclePrediction;