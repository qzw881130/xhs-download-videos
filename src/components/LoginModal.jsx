import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaFacebook, FaGithub, FaGoogle, FaTwitter, FaApple } from 'react-icons/fa';
import { getTranslation } from '../i18n';

function LoginModal({ language, isOpen, onClose, onLoginSuccess }) {
    const t = (key) => getTranslation(language, key);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem('loginEmail');
        const storedPassword = localStorage.getItem('loginPassword');
        const storedRememberMe = localStorage.getItem('rememberMe') === 'true';

        if (storedRememberMe) {
            setLoginEmail(storedEmail || '');
            setLoginPassword(storedPassword || '');
            setRememberMe(storedRememberMe);
        }
    }, []);

    const handleSupabaseSignUp = async () => {
        setIsLoading(true);
        try {
            const user = await window.electron.supabaseSignUp(loginEmail, loginPassword);
            // toast.success(t('Sign_up_successful'), { autoClose: 200 });
            if (rememberMe) {
                localStorage.setItem('loginEmail', loginEmail);
                localStorage.setItem('loginPassword', loginPassword);
                localStorage.setItem('rememberMe', rememberMe);
            }
        } catch (error) {
            toast.error(t('Error signing up'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSupabaseSignIn = async () => {
        setIsLoading(true);
        try {
            const user = await window.electron.supabaseSignIn(loginEmail, loginPassword);

            onLoginSuccess(user);
            // toast.success(t('Sign_in_successful'), { autoClose: 200 });
            if (rememberMe) {
                localStorage.setItem('loginEmail', loginEmail);
                localStorage.setItem('loginPassword', loginPassword);
                localStorage.setItem('rememberMe', rememberMe);
            }
        } catch (error) {
            toast.error(t('Error signing in'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleThirdPartySignIn = async (provider) => {
        setIsLoading(true);
        try {
            const data = await window.electron.supabaseSignInWithProvider(provider);
            if (data.url) {
                window.electron.openAuthWindow(data.url);
                window.electron.onOAuthCallback(async (code) => {
                    try {
                        const { session, user } = await window.electron.supabaseExchangeCodeForSession(code);
                        if (user) {
                            onLoginSuccess(user);
                            // toast.success(t('Sign_in_successful'), { autoClose: 1000 });
                        } else {
                            throw new Error('No user returned from session exchange');
                        }
                    } catch (error) {
                        console.error('Error exchanging code for session:', error);
                        toast.error(t('Error signing in'));
                    } finally {
                        setIsLoading(false);
                    }
                });
            }
        } catch (error) {
            console.error(`Error signing in with ${provider}:`, error);
            toast.error(t(`Error signing in with ${provider}`));
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-xl w-96 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t('Login_or_SignUp')}</h3>
                </div>
                <a
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 absolute right-5 top-5 cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </a>
                <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t('Email')}
                    className="w-full p-2 mb-4 border rounded"
                />
                <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('Password')}
                    className="w-full p-2 mb-4 border rounded"
                />
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mr-2"
                    />
                    <label>{t('Remember_Me')}</label>
                </div>
                <div className="flex justify-between mb-4">
                    <button
                        onClick={handleSupabaseSignIn}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        disabled={isLoading}
                    >
                        {isLoading ? t('Logging_in') : t('SignIn')}
                    </button>
                    <button
                        onClick={handleSupabaseSignUp}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                        disabled={isLoading}
                    >
                        {isLoading ? t('Signing_up') : t('SignUp')}
                    </button>
                </div>
                <div className="mt-4">
                    <p className="text-center mb-2">{t('Or sign in with')}</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => handleThirdPartySignIn('facebook')} className="text-blue-600 hover:border hover:border-blue-700 bg-white hover:bg-gray-100 border-none">
                            <FaFacebook size={24} />
                        </button>
                        <button onClick={() => handleThirdPartySignIn('github')} className="text-gray-800 hover:border hover:border-gray-900 bg-white hover:bg-gray-100 border-none">
                            <FaGithub size={24} />
                        </button>
                        <button onClick={() => handleThirdPartySignIn('google')} className="text-red-600 hover:border hover:border-red-700 bg-white hover:bg-gray-100 border-none">
                            <FaGoogle size={24} />
                        </button>
                        <button onClick={() => handleThirdPartySignIn('twitter')} className="text-blue-400 hover:border hover:border-blue-500 bg-white hover:bg-gray-100 border-none">
                            <FaTwitter size={24} />
                        </button>
                        <button onClick={() => handleThirdPartySignIn('apple')} className="text-gray-800 hover:border hover:border-gray-900 bg-white hover:bg-gray-100 border-none">
                            <FaApple size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
