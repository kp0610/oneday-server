import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Removed
import { useProfile } from './ProfileContext';
import Profile from './Profile'; // Import the Profile component
import './ProfileHeader.css';

const ProfileHeader = () => {
    const { profile, loading } = useProfile();
    // const navigate = useNavigate(); // Removed
    const [showProfileModal, setShowProfileModal] = useState(false); // State for modal visibility

    const handleProfileClick = () => {
        // navigate('/profile'); // Replaced with modal open
        setShowProfileModal(true);
    };

    const handleCloseProfileModal = () => {
        setShowProfileModal(false);
    };

    if (loading) {
        return <div className="profile-header-container skeleton"></div>;
    }

    return (
        <>
            <div className="profile-header-container" onClick={handleProfileClick}>
                <span className="profile-nickname">{profile.username || 'Guest'}</span> {/* Use profile.username */}
                <div className="profile-image-wrapper">
                                    {profile.profileImage ? (
                                        <img src={profile.profileImage} alt="Profile" className="profile-image" />
                                    ) : (
                                        <div className="profile-image-default"></div>
                                    )}                </div>
            </div>
            {showProfileModal && (
                <Profile show={showProfileModal} onClose={handleCloseProfileModal} />
            )}
        </>
    );
};

export default ProfileHeader;
