import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Removed
import './Profile.css';
import ImageUploader from './ImageUploader';
import Modal from './Modal';
import { useProfile } from './ProfileContext'; // Import the context hook
import { MdOutlineCameraAlt } from 'react-icons/md'; // Import MdOutlineCameraAlt
import { FiEdit2 } from 'react-icons/fi'; // Import FiEdit2 for a simpler, rounder pencil icon

const Profile = ({ show, onClose }) => { // Accept show and onClose props
    const { profile, updateProfileContext } = useProfile(); // Use the context
    // const navigate = useNavigate(); // Removed

    const [username, setUsername] = useState('');
    const [profileImage, setProfileImage] = useState(null); // This is for the new file to be uploaded
    const [previewImage, setPreviewImage] = useState('');
    const [email, setEmail] = useState(''); // Email is not part of the context, will handle separately if needed
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [editingUsername, setEditingUsername] = useState('');

    // State for Change Password Modal
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // State for Change Email Modal
    const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [passwordForEmailChange, setPasswordForEmailChange] = useState('');
    const [emailError, setEmailError] = useState('');

    // State for in-app success popup
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');




    const [showWithdrawModal, setShowWithdrawModal] = useState(false); // New state for withdraw modal

    const [showMyInfoDetails, setShowMyInfoDetails] = useState(false); // New state for "내 정보 확인하기" button

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        // Populate form with data from context
        if (profile) {
            setUsername(profile.username || ''); // Use profile.username
            setEditingUsername(profile.username || ''); // Initialize editingUsername
            const imageUrlFromContext = profile.profileImage || '';
            setPreviewImage(imageUrlFromContext); // Use profile.profile_image_url
            setEmail(profile.email || ''); // Set email from profile
        }
    }, [profile]);

    const handleImageUpload = async (file, dataUrl) => {
        setProfileImage(file);
        setPreviewImage(dataUrl);
        // Automatically save after image upload
        await handleSave(file); // Pass the file directly to handleSave
    };

    const handleSave = async (uploadedFile = null) => { // Accept uploadedFile as an argument
        if (!userId) return;

        const formData = new FormData();
        formData.append('username', username);
        if (uploadedFile) {
            formData.append('profileImage', uploadedFile);
        } else if (profileImage) {
            formData.append('profileImage', profileImage);
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile/${userId}`, {
                method: 'POST', // Changed from PUT to POST
                body: formData,
            });

            if (res.ok) {
                const updatedProfileData = await res.json();
                setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 3000); // Hide after 3 seconds
                updateProfileContext(updatedProfileData); // Update the global context
                setPreviewImage(updatedProfileData.profile_image_url || ''); // Ensure previewImage reflects the saved URL
                // onClose(); // Removed: User will close the modal manually
            } else {
                const errorData = await res.json();
                console.error('Profile.js - Error response from backend:', errorData); // Debug log
                setSuccessMessage(`프로필 업데이트 실패: ${errorData.msg}`);
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            setSuccessMessage(`프로필 업데이트 중 오류가 발생했습니다: ${error.message}`);
            setShowSuccessPopup(true);
        }
    };

    // ... (handleChangePassword, handleChangeEmail, handleLogout functions remain largely the same)
    const handleCancelPasswordChange = () => {
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        if (newPassword !== confirmPassword) {
            setPasswordError('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!currentPassword || !newPassword) {
            setPasswordError('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/change-password/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.msg);
                setShowChangePasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPasswordError(data.msg);
            }
        } catch (error) {
            console.error('Failed to change password:', error);
            setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
        }
    };

    const handleCancelEmailChange = () => {
        setShowChangeEmailModal(false);
        setNewEmail('');
        setPasswordForEmailChange('');
        setEmailError('');
    };

    const handleChangeEmail = async () => {
        setEmailError('');
        if (!newEmail || !passwordForEmailChange) {
            setEmailError('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/change-email/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmail, password: passwordForEmailChange }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.msg);
                setShowChangeEmailModal(false);
                setNewEmail('');
                setPasswordForEmailChange('');
                // You might want to refresh user data here
            } else {
                setEmailError(data.msg);
            }
        } catch (error) {
            console.error('Failed to change email:', error);
            setEmailError(`이메일 변경 중 오류가 발생했습니다: ${error.message}`);
        }
    };





    const handleEditNicknameClick = () => {
        setIsEditingNickname(true);
        setEditingUsername(profile.username || ''); // Load current username into editing state
    };

    const handleNicknameSave = async () => {
        if (editingUsername === (profile.username || '')) {
            setIsEditingNickname(false); // No change, just exit editing mode
            return;
        }

        if (!editingUsername.trim()) {
            alert('닉네임을 입력해주세요.');
            setEditingUsername(profile.username || ''); // Revert to current username
            setIsEditingNickname(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile/${userId}`, {
                method: 'PUT', // Assuming PUT for profile updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: editingUsername }),
            });

            if (res.ok) {
                const updatedProfileData = await res.json();
                setSuccessMessage('닉네임이 성공적으로 변경되었습니다.');
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 3000); // Hide after 3 seconds
                updateProfileContext(updatedProfileData); // Update the global context
                setIsEditingNickname(false); // Exit editing mode
            } else {
                const errorData = await res.json();
                console.error('Profile.js - Error response from backend:', errorData);
                alert(`닉네임 변경 실패: ${errorData.msg}`);
                setEditingUsername(profile.username || ''); // Revert on error
                setIsEditingNickname(false);
            }
        } catch (error) {
            console.error('Failed to change nickname:', error);
            alert(`닉네임 변경 중 오류가 발생했습니다: ${error.message}`);
            setEditingUsername(profile.username || ''); // Revert on error
            setIsEditingNickname(false);
        }
    };

    const handleNicknameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent new line in input
            handleNicknameSave();
        } else if (e.key === 'Escape') {
            setIsEditingNickname(false);
            setEditingUsername(profile.username || ''); // Revert to current username
        }
    };

    const handleNicknameBlur = () => {
        // If the user blurs without pressing Enter, we can either save or revert.
        // For now, let's revert if no change was made, otherwise, prompt to save or discard.
        // Or, simply revert if not saved by Enter.
        if (editingUsername !== (profile.username || '')) {
            // If there's an unsaved change, we might want to ask the user or auto-save.
            // For this implementation, we'll just revert if not explicitly saved by Enter.
            setEditingUsername(profile.username || '');
        }
        setIsEditingNickname(false);
    };

    const handleLogout = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
                method: 'GET',
                credentials: 'include',
            });

            if (res.ok) {
                localStorage.clear();
                window.location.href = '/login';
            } else {
                const errorData = await res.json();
                console.error('Logout failed on backend:', errorData.msg);
                alert('로그아웃 실패: ' + errorData.msg);
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    };

    const handleWithdraw = async () => {
        if (!userId) return;

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/withdraw/${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('회원 탈퇴가 성공적으로 처리되었습니다.');
                localStorage.clear(); // Clear all local storage data
                window.location.href = '/login'; // Redirect to login page
            } else {
                const errorData = await res.json();
                alert(`회원 탈퇴 실패: ${errorData.msg}`);
            }
        } catch (error) {
            console.error('Failed to withdraw account:', error);
            alert(`회원 탈퇴 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setShowWithdrawModal(false); // Close modal regardless of success/failure
        }
    };

    const backgroundImageUrl = previewImage ?
        `url(${previewImage.startsWith('data:') || previewImage.startsWith('http://') || previewImage.startsWith('https://')
            ? previewImage
            : `${process.env.REACT_APP_API_URL}${previewImage}`
        })` :
        'none';

    return (
        <Modal show={show} onClose={onClose} contentClassName="profile-modal-content"> {/* Wrap content in Modal */}
            <div className="profile-container">
                <button className="close-profile-button" onClick={onClose}>x</button> {/* Added close button */}
                <h1>My Profile</h1>
                <div className="profile-image-and-name">
                    <div
                        className="profile-picture-container"
                        style={{ border: '1px solid #E1E7EF', backgroundImage: backgroundImageUrl }}
                    >
                        <ImageUploader onImageUpload={handleImageUpload} className="profile-upload-button">
                            <MdOutlineCameraAlt />
                        </ImageUploader>
                    </div>
                    <div className="nickname-display-wrapper">
                        {isEditingNickname ? (
                            <input
                                type="text"
                                className="profile-nickname-edit-input"
                                value={editingUsername}
                                onChange={(e) => setEditingUsername(e.target.value)}
                                onKeyDown={handleNicknameKeyDown}
                                onBlur={handleNicknameBlur}
                                autoFocus
                            />
                        ) : (
                            <span className="profile-nickname-display-popup">{profile.username || 'Guest'}</span>
                        )}
                        <FiEdit2 className={`edit-nickname-icon ${isEditingNickname ? 'is-editing' : ''}`} onClick={handleEditNicknameClick} />
                    </div>
                </div>
                
                
                
                
                                <div className="profile-settings-options">
                                    <div style={{
                                        height: '1px',
                                        width: '272px',
                                        margin: '2px auto', /* Reduced margin-top */
                                        backgroundImage: 'repeating-linear-gradient(to right, #C1C4CA 0, #C1C4CA 3.5px, transparent 3.5px, transparent 9px)', // 3.5px dash + 5.5px gap = 9px total
                                        backgroundSize: '100% 1px',
                                        backgroundRepeat: 'no-repeat'
                                    }}></div>
          
                    <button 
                        className={`settings-button my-info-button ${showMyInfoDetails ? 'active' : ''}`} 
                        onClick={() => setShowMyInfoDetails(!showMyInfoDetails)} 
                    >
                        <span className="my-info-text">내 정보 확인하기</span>
                        {showMyInfoDetails && (
                            <div className="my-info-details">
                                                                                        <div className="my-info-item-group">
                                                                                            <p className="my-info-label">이름</p>
                                                                                            <div className="my-info-chip">{profile.username || 'N/A'}</div>
                                                                                        </div>
                                                                                        <div className="my-info-item-group">
                                                                                            <p className="my-info-label">아이디</p>
                                                                                            <div className="my-info-chip">{profile.email || 'N/A'}</div>
                                                                                        </div>
                                                                                        <div className="my-info-item-group">
                                                                                            <p className="my-info-label">비밀번호</p>
                                                                                            <div className="my-info-chip">********</div>
                                                                                        </div>
                                                                                        {/* Add more profile details here if needed */}
                                                                                    </div>
                                                                                )}
                                                                                </button>
                    <div style={{
                        height: '1px',
                        width: '272px',
                        margin: '10px auto',
                        backgroundImage: 'repeating-linear-gradient(to right, #C1C4CA 0, #C1C4CA 3.5px, transparent 3.5px, transparent 9px)', // 3.5px dash + 5.5px gap = 9px total
                        backgroundSize: '100% 1px',
                        backgroundRepeat: 'no-repeat'
                    }}></div>
                    <button onClick={handleLogout} className="settings-button" style={{ backgroundColor: '#FF5C5C', borderRadius: '10px', color: '#ffffff' }}>로그아웃</button>
                    <span className="withdraw-text" onClick={() => setShowWithdrawModal(true)}>탈퇴</span>
                </div>
            </div>

            {/* Modals remain the same */}
            <Modal show={showChangePasswordModal} onClose={handleCancelPasswordChange} contentClassName="change-password-modal-content">
                <h3>비밀번호 변경</h3>
                <div className="profile-form-group">
                    <input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>
                <div className="profile-form-group">
                    <input
                        type="password"
                        placeholder="새 비밀번호"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <div className="profile-form-group">
                    <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                {passwordError && <p className="error-message">{passwordError}</p>}
                <div className="modal-actions">
                    <button onClick={handleChangePassword}>변경하기</button>
                    <button onClick={handleCancelPasswordChange}>취소</button>
                </div>
            </Modal>

            <Modal show={showChangeEmailModal} onClose={() => {
                setShowChangeEmailModal(false);
                setNewEmail('');
                setPasswordForEmailChange('');
                setEmailError('');
            }} contentClassName="change-email-modal-content">
                <h3>아이디(이메일) 변경</h3>
                <div className="profile-form-group">
                    <input
                        type="email"
                        placeholder="새 이메일"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                </div>
                <div className="profile-form-group">
                    <input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={passwordForEmailChange}
                        onChange={(e) => setPasswordForEmailChange(e.target.value)}
                    />
                </div>
                {emailError && <p className="error-message">{emailError}</p>}
                <div className="modal-actions">
                    <button onClick={handleChangeEmail}>변경하기</button>
                    <button onClick={handleCancelEmailChange}>취소</button>
                </div>
            </Modal>





            {/* In-app Success Popup */}
            <Modal show={showSuccessPopup} onClose={() => setShowSuccessPopup(false)}>
                <h3>알림</h3>
                <p>{successMessage}</p>
                <div className="modal-actions">
                    <button onClick={() => setShowSuccessPopup(false)}>확인</button>
                </div>
            </Modal>

            {/* Withdrawal Confirmation Modal */}
            <Modal show={showWithdrawModal} onClose={() => setShowWithdrawModal(false)}>
                <h3>회원 탈퇴</h3>
                <p>정말 탈퇴하시겠습니까?</p>
                <p>저장된 정보가 영구적으로 사라집니다.</p>
                <div className="modal-actions">
                    <button onClick={handleWithdraw} style={{ backgroundColor: '#FF5C5C', color: 'white' }}>확인</button>
                    <button onClick={() => setShowWithdrawModal(false)}>취소</button>
                </div>
            </Modal>
        </Modal>
    );
};

export default Profile;