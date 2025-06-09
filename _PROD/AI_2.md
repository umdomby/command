нужно при нажатии этой кнопки
<button
onClick={() => toggleTab('esp')}
onTouchEnd={() => toggleTab('esp')}
className={[styles.tabButton, activeMainTab === 'esp' ? styles.activeTab : ''].join(' ')}
>
{activeMainTab === 'esp' ? '▲' : '▼'} <img src="/joy.svg" alt="Joystick" />
</button>

открывалась всегда панель а не Joystick

\\wsl.localhost\Ubuntu-24.04\home\pi\prod\docker-ardua-444\components\control\SocketClient.tsx
setControlVisible(false)

отвечай на русском
дай короткий ответ, укажи в каком файле и на какой строке изменить код


setControlVisible

    useEffect(() => {
        // Показываем джойстики автоматически, если autoShowControls === true и статус Connected
        if (autoShowControls && isConnected && isIdentified && espConnected) {
            setControlVisible(true)
            setActiveTab(null)
        }
    }, [autoShowControls, isConnected, isIdentified, espConnected])

должно быть false


