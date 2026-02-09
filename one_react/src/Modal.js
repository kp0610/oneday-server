import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ show, onClose, children, contentClassName }) => {
    if (!show) {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className={`modal-content ${contentClassName || ''}`} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
