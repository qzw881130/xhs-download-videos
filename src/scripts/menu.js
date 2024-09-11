document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu ul li');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有菜单项的 active 类
            menuItems.forEach(i => i.classList.remove('active'));
            // 为当前点击的菜单项添加 active 类
            item.classList.add('active');
        });
    });
});