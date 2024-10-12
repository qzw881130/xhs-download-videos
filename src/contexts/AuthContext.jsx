import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const currentUser = await window.electron.supabaseGetUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    };

    const login = (userData) => {
        setUser(userData);
        setShowLoginModal(false);
    };

    const logout = () => {
        setUser(null);
    };

    const openLoginModal = () => {
        setShowLoginModal(true);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
    };

    return (
        <AuthContext.Provider value={{ user, showLoginModal, login, logout, openLoginModal, closeLoginModal }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
