import React from 'react';
const kofi = '/src/assets/images/kofi_bg_tag_white.png';

function KofiButton() {
    const onClick = () => {
        const kofiUrl = 'https://ko-fi.com/zhiwei5921';
        if (window.electron && window.electron.openExternal) {
            window.electron.openExternal(kofiUrl);
        } else {
            // 如果 electron.openExternal 不可用，回退到普通的窗口打开方式
            window.open(kofiUrl, '_blank');
        }
    };

    return (
        <button onClick={onClick} className="bg-transparent hover:bg-blue-100 border-0 p-0">
            <img src={kofi} alt="Support me on Ko-fi" />
        </button>
    );
}

export default KofiButton;