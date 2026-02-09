import React from 'react';
import { Link } from 'react-router-dom';
import './SlideOutNav.css';

// Image assets from Figma
const imgVector = "https://www.figma.com/api/mcp/asset/632e0f64-99da-422a-bac7-bd26956a435a";
const imgVector1 = "https://www.figma.com/api/mcp/asset/fc49a9c4-6c42-42b0-b212-bfbc9b172a7f";
const imgGroup = "https://www.figma.com/api/mcp/asset/0166348e-dd57-4ead-8823-91fd7309cb9a";

// Helper Component for "다이어리" (Diary)
function Group1({ className, onClick }: { className?: string, onClick: () => void }) {
  return (
    <div className={`collection-item-wrapper ${className}`} onClick={onClick} data-node-id="763:2372">
        <div className="collection-item-content">
            <p className="collection-item-text" data-node-id="661:3809">
                다이어리
            </p>
        </div>
    </div>
  );
}

// Helper Component for "스톱워치" (Stopwatch)
function Group2({ className, onClick }: { className?: string, onClick: () => void }) {
  return (
    <div className={`collection-item-wrapper ${className}`} onClick={onClick} data-node-id="763:2373">
        <div className="collection-item-content">
            <p className="collection-item-text" data-node-id="661:3810">
                스톱워치
            </p>
        </div>
    </div>
  );
}

// Helper Component for "헬스케어" (Healthcare)
function Group3({ className, onClick }: { className?: string, onClick: () => void }) {
  return (
    <div className={`collection-item-wrapper ${className}`} onClick={onClick} data-node-id="763:2375">
        <div className="collection-item-content">
            <p className="collection-item-text" data-node-id="661:3811">
                헬스케어
            </p>
        </div>
    </div>
  );
}

// Helper Component for "템플릿" (Template)
function TemplateGroup1({ className, onClick }: { className?: string, onClick: () => void }) {
    return (
        <div className={`collection-item-wrapper ${className}`} onClick={onClick}>
            <div className="collection-item-content">
                <p className="collection-item-text">
                    템플릿 1
                </p>
            </div>
        </div>
    );
}

// Helper Component for "템플릿" (Template)
function TemplateGroup2({ className, onClick }: { className?: string, onClick: () => void }) {
    return (
        <div className={`collection-item-wrapper ${className}`} onClick={onClick}>
            <div className="collection-item-content">
                <p className="collection-item-text">
                    템플릿 2
                </p>
            </div>
        </div>
    );
}

// Helper Component for "템플릿" (Template)
function TemplateGroup3({ className, onClick }: { className?: string, onClick: () => void }) {
    return (
        <div className={`collection-item-wrapper ${className}`} onClick={onClick}>
            <div className="collection-item-content">
                <p className="collection-item-text">
                    템플릿 3
                </p>
            </div>
        </div>
    );
}



const SlideOutNav = ({ isOpen, onClose, navType }) => {
    const isTemplateNav = navType === 'template';

    return (
        <>
            <div className={`slide-out-nav-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
            <div className={`slide-out-nav-container ${isOpen ? 'show' : ''}`}>
                <div className="slide-out-nav-header">
                    <h2 data-node-id="661:3800">{isTemplateNav ? "템플릿" : "모아보기"}</h2>
                </div>
                <div className="slide-out-nav-content">
                    <nav className="collection-nav-grid">
                        {isTemplateNav ? (
                            <>
                                <Link to="/template" onClick={onClose} className="collection-link">
                                    <TemplateGroup1 />
                                </Link>
                                <Link to="/template" onClick={onClose} className="collection-link">
                                    <TemplateGroup2 />
                                </Link>
                                <Link to="/template" onClick={onClose} className="collection-link">
                                    <TemplateGroup3 />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/healthcare-collection" onClick={onClose} className="collection-link">
                                    <Group3 />
                                </Link>
                                <Link to="/stopwatch-collection" onClick={onClose} className="collection-link">
                                    <Group2 />
                                </Link>
                                <Link to="/diary-collection" onClick={onClose} className="collection-link">
                                    <Group1 />
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </>
    );
};

export default SlideOutNav;