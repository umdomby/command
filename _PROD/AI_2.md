при включении компонента VirtualBox телефон должен работать только в горизонтальном режиме.
экран должен дублироваться
при отключении VirtualBox - повторным нажатием на кнопку должн овернуться в работу два режима - горизонтальный и вертикальный
{isDeviceOrientationSupported && (
<Button
onClick={() => {
const newState = !isVirtualBoxActive;
setIsVirtualBoxActive(newState);
addLog(`VirtualBox ${newState ? 'активирован' : 'деактивирован'}`, 'info');
setShowJoystickMenu(false);
...
