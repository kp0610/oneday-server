import React, { useState, useEffect } from 'react';
import './Login.css';
import { useProfile } from './ProfileContext'; // Import the context hook
import kakaoIcon from './icons/kakao logo.svg'; // Import Kakao icon
import googleIcon from './icons/Google Logo.svg'; // Import Google icon
// import appleIcon from './icons/Apple Logo.svg'; // Import Apple icon
import naverIcon from './icons/naver logo.svg'; // Import Naver icon

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState(''); // New state for nickname
    const [confirmPassword, setConfirmPassword] = useState(''); // New state for confirm password
    const [error, setError] = useState('');
    const [isAutoLogin, setIsAutoLogin] = useState(false); // New state for auto-login
    const { refreshProfile } = useProfile(); // Get the refresh function

    const handleResponse = (data) => {
        if (data.userId) {
            localStorage.setItem('userId', data.userId);
            if (isAutoLogin) {
                localStorage.setItem('autoLoginEmail', email);
                localStorage.setItem('isAutoLogin', 'true');
            } else {
                localStorage.removeItem('autoLoginEmail');
                localStorage.removeItem('isAutoLogin');
            }
            refreshProfile(); // Trigger profile refetch after setting userId
            onLogin(); // Call onLogin to update isAuthenticated state in App.js
        } else {
            setError(data.msg || data.message || '오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        const savedEmail = localStorage.getItem('autoLoginEmail');
        const savedIsAutoLogin = localStorage.getItem('isAutoLogin') === 'true';

        if (savedIsAutoLogin && savedEmail) {
            setEmail(savedEmail);
            setIsAutoLogin(true);
            // App.js's routing handles actual auto-login (navigating to home) based on userId.
        }
    }, []); // Run once on mount

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || '로그인 실패');
            handleResponse(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }
        if (!isEmailVerified) {
            setError('이메일 인증을 완료해주세요.');
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname }), // Include nickname
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || '회원가입 실패');
            alert(data.msg); // Display message from backend (e.g., "회원가입이 완료되었습니다. 이메일을 확인하여 인증해주세요.")
            setIsLogin(true); // Switch to login form
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSendVerificationCode = async () => {
        setError('');
        if (!email) {
            setError('이메일을 입력해주세요.');
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-verification-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || '인증번호 발송 실패');
            alert(data.msg);
            setIsEmailSent(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleVerifyCode = async () => {
        setError('');
        if (!verificationCode) {
            setError('인증번호를 입력해주세요.');
            return;
        }
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || '인증번호 확인 실패');
            alert(data.msg);
            setIsEmailVerified(true);
            setError(''); // Clear error on successful verification
        } catch (err) {
            setError(err.message);
        }
    };

    const showSignup = (e) => {
        e.preventDefault();
        setError('');
        setIsLogin(false);
    };

    const showLogin = (e) => {
        e.preventDefault();
        setError('');
        setIsLogin(true);
    };

    return (
        <div className="main-wrapper">
            <div className="info-panel">
                <h2>OneDay</h2>
                <p>하루를 하나로 관리하다.</p>
            </div>
            <div className="form-wrapper">
                {isLogin ? (
                    <div className="form-container" id="login-form">
                        <h1>LOGIN</h1>
                        <form onSubmit={handleLogin}>
                            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            {error && <p className="error-message">{error}</p>}
                            <div className="options">
                                <label><input type="checkbox" checked={isAutoLogin} onChange={(e) => setIsAutoLogin(e.target.checked)} /> 자동 로그인</label>
                            </div>
                            <button type="submit">로그인</button>
                        </form>
                        <p className="toggle-form">계정이 없으신가요? <a href="#" id="show-signup" onClick={showSignup}>회원가입</a></p>
                        <div className="social-login-divider">
                            <span className="line"></span>
                            <span className="text">소셜미디어로 로그인</span>
                            <span className="line"></span>
                        </div>
                        <div className="social-login-buttons">
                            <div className="social-icon-button kakao-button" onClick={() => window.location.href = 'http://localhost:3001/auth/kakao'}>
                                <img src={kakaoIcon} alt="Kakao Login" />
                            </div>
                            <div className="social-icon-button google-button" onClick={() => window.location.href = 'http://localhost:3001/auth/google'}>
                                <img src={googleIcon} alt="Google Login" />
                            </div>
                            <div className="social-icon-button naver-button" onClick={() => window.location.href = 'http://localhost:3001/auth/naver'}>
                                <img src={naverIcon} alt="Naver Login" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="form-container" id="signup-form">
                        <h1>SIGN UP</h1>
                        <form onSubmit={handleSignup}>
                            <div className="email-input-wrapper">
                                <input
                                    type="email"
                                    placeholder="이메일"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isEmailSent} // Disable email input after sending code
                                />
                                <button type="button" className="verify-button" onClick={handleSendVerificationCode} disabled={isEmailSent}>인증</button>
                            </div>
                            {isEmailSent && (
                                <div className="verification-code-wrapper">
                                    <input
                                        type="text"
                                        placeholder="인증번호 입력"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="verify-button" onClick={handleVerifyCode} disabled={isEmailVerified}>확인</button>
                                </div>
                            )}
                            <input type="text" placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="login-input" />
                            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            {error && <p className="error-message">{error}</p>}
                            <div className="terms">
                                <label><input type="checkbox" required /> 이용약관 동의 (필수)</label>
                                <label><input type="checkbox" required /> 개인정보 수집 및 이용 동의 (필수)</label>
                            </div>
                            <button type="submit">회원가입</button>
                        </form>
                        <p className="toggle-form">이미 계정이 있으신가요? <a href="#" id="show-login" onClick={showLogin}>로그인</a></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;