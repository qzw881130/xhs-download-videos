import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { getTranslation } from '../i18n';

function UserMenu({ user, language, onSignOut }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const t = (key) => getTranslation(language, key);

    const handleSignOut = async () => {
        try {
            await window.electron.supabaseSignOut();
            onSignOut();
            toast.success(t('Sign_out_successful'), { autoClose: 1000 });
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error(t('Error signing out'));
        }
        setShowUserMenu(false);
    };

    const handleRecharge = () => {
        // Implement recharge functionality here
        console.log('Recharge clicked');
        toast.info(t('Recharge_not_implemented'), { autoClose: 2000 });
        setShowUserMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="bg-gray-200 text-gray-700 mr-4 hover:bg-gray-300 focus:outline-none px-3 py-1 rounded"
            >
                {user.email}
                <svg className="inline-block ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-200 rounded-md shadow-lg py-1">
                    <button
                        onClick={handleSignOut}
                        className="block px-4 py-2 text-sm text-black bg-gray-200 hover:bg-gray-500 w-full text-left"
                    >
                        {t('signOut')}
                    </button>
                    <button
                        onClick={handleRecharge}
                        className="block px-4 py-2 text-sm text-black bg-gray-200 hover:bg-gray-300 w-full text-left"
                    >
                        {t('recharge')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
