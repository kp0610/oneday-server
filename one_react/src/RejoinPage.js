import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from './ProfileContext'; // Assuming you want to refresh profile after rejoin
import './RejoinPage.css'; // Create this CSS file for styling

const RejoinPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { refreshProfile } = useProfile();
    const [rejoinInfo, setRejoinInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const provider = params.get('provider');
        const provider_id = params.get('provider_id');
        const email = params.get('email');
        const message = params.get('message');

        if (provider && provider_id && email && message) {
            setRejoinInfo({ provider, provider_id, email, message });
        } else {
            setError('재가입 정보가 불완전합니다.');
        }
        setLoading(false);
    }, [location]);

    const handleRejoin = async () => {
        if (!rejoinInfo) return;
        setLoading(true);
        setError('');

        try {
            // For username, real_name, profile_image_url, we need to re-fetch them from Google/Kakao/Naver
            // or pass them from the backend callback. For simplicity, we'll assume
            // the backend can reconstruct or doesn't strictly need them for re-join.
            // However, the backend /rejoin route expects them.
            // A more robust solution would be to store these in session/localstorage temporarily
            // or pass them as query params from the initial social login callback.
            // For now, we'll use placeholder/reconstruct from email if possible.
            // The backend /rejoin route expects username, real_name, profile_image_url.
            // We need to get these from the original profile object.
            // Since the backend callback redirects, we can't easily get the full profile here.
            // A better approach would be to store the full profile in a temporary session on the backend
            // and retrieve it here, or pass more query params.
            // For this example, we'll assume the backend can derive/reconstruct what it needs
            // or that the user's original username/real_name/profile_image_url are not critical for re-join.
            // However, the backend /rejoin route *does* expect them.
            // Let's assume for now that the backend will use the email to find the original profile
            // or that these fields are not strictly required for the INSERT.
            // Given the backend /rejoin route expects them, we need to pass them.
            // The simplest way is to pass them as query parameters from the server.js callback.
            // Let's update server.js callback to include username, real_name, profile_image_url.

            // For now, let's assume we get them from query params as well.
            const params = new URLSearchParams(location.search);
            const username = params.get('username');
            const real_name = params.get('real_name');
            const profile_image_url = params.get('profile_image_url');


            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/rejoin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    provider: rejoinInfo.provider,
                    provider_id: rejoinInfo.provider_id,
                    email: rejoinInfo.email,
                    username: username || rejoinInfo.email.split('@')[0], // Fallback if not passed
                    real_name: real_name || rejoinInfo.email.split('@')[0], // Fallback
                    profile_image_url: profile_image_url || null, // Fallback
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.msg);
                localStorage.setItem('userId', data.userId); // Store new userId
                refreshProfile(); // Refresh profile context
                navigate('/home'); // Redirect to home page
            } else {
                setError(data.msg || '재가입 실패');
            }
        } catch (err) {
            setError(err.message || '네트워크 오류');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="rejoin-container">로딩 중...</div>;
    }

    if (error) {
        return <div className="rejoin-container error">{error}</div>;
    }

    if (!rejoinInfo) {
        return <div className="rejoin-container error">잘못된 접근입니다.</div>;
    }

    return (
        <div className="rejoin-container">
            <div className="rejoin-card">
                <h2>회원 재가입</h2>
                <p>{rejoinInfo.message}</p>
                <p>계정 정보: {rejoinInfo.email}</p>
                <div className="rejoin-actions">
                    <button onClick={handleRejoin} disabled={loading}>
                        {loading ? '처리 중...' : '예, 재가입하겠습니다.'}
                    </button>
                    <button onClick={() => navigate('/login')} disabled={loading}>
                        아니요, 취소하겠습니다.
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejoinPage;
