import React from 'react';
import './ConfirmationModal.css';
import Modal from './Modal';

const ConfirmationModal = ({ show, onClose, onConfirm, message }) => {
    if (!show) {
        return null;
    }

    return (
        <Modal show={show} onClose={onClose}>
            <div className="confirmation-modal">
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm}>확인</button>
                    <button onClick={onClose}>취소</button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
