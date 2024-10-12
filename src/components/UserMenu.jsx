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
                className="text-white mr-4 hover:text-gray-300 focus:outline-none"
            >
                {user.email}
            </button>
            {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                    <button
                        onClick={handleSignOut}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                        {t('signOut')}
                    </button>
                    <button
                        onClick={handleRecharge}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                        {t('recharge')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserMenu;
