при включении компонента VirtualBox_Zag телефон должен работать только в горизонтальном режиме.
экран должен дублироваться
при отключении VirtualBox_Zag - повторным нажатием на кнопку должн овернуться в работу два режима - горизонтальный и вертикальный
{isDeviceOrientationSupported && (
<Button
onClick={() => {
const newState = !isVirtualBoxActive;
setIsVirtualBoxActive(newState);
addLog(`VirtualBox_Zag ${newState ? 'активирован' : 'деактивирован'}`, 'info');
setShowJoystickMenu(false);
...
