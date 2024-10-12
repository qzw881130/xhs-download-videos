import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true); // 新增状态
    const [signal, setSignal] = useState(0);

    useEffect(() => {
        checkAuth();
    }, [signal]);

    const checkAuth = async () => {
        setIsAuthChecking(true); // 开始检查认证状态
        try {
            const currentUser = await window.electron.supabaseGetUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setIsAuthChecking(false); // 结束检查认证状态
        }
    };

    const login = (userData) => {
        setUser(userData);
        setShowLoginModal(false);
    };

    const logout = async () => {
        try {
            await window.electron.supabaseSignOut();
            setUser(null);
            // toast.success('Sign out successful', { autoClose: 1000 });
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Error signing out');
        }
    };

    const openLoginModal = () => {
        setShowLoginModal(true);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
    };

    const handleSupabaseSignUp = async (email, password) => {
        setIsLoading(true);
        try {
            const user = await window.electron.supabaseSignUp(email, password);
            login(user);
            setSignal(x => x + 1);
            // toast.success('Sign up successful', { autoClose: 1000 });
        } catch (error) {
            toast.error('Error signing up');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSupabaseSignIn = async (email, password) => {
        setIsLoading(true);
        try {
            const result = await window.electron.supabaseSignIn(email, password);
            console.log('Sign in result:', result);
            if (result.error) throw result.error;
            login(result.user);
            await window.electron.setAuthToken(result.session.access_token);
            setSignal(x => x + 1);
            toast.success('Sign in successful', { autoClose: 1000 });
        } catch (error) {
            console.error('Sign in error:', error);
            toast.error(`Error signing in: ${error.message}`);
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
                            login(user);
                            toast.success('Sign in successful', { autoClose: 1000 });
                        } else {
                            throw new Error('No user returned from session exchange');
                        }
                    } catch (error) {
                        console.error('Error exchanging code for session:', error);
                        toast.error('Error signing in');
                    } finally {
                        setIsLoading(false);
                    }
                });
            }
        } catch (error) {
            console.error(`Error signing in with ${provider}:`, error);
            toast.error(`Error signing in with ${provider}`);
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            showLoginModal,
            isLoading,
            isAuthChecking, // 新增
            login,
            logout,
            openLoginModal,
            closeLoginModal,
            handleSupabaseSignUp,
            handleSupabaseSignIn,
            handleThirdPartySignIn
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
