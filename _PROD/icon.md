https://freesvgicons.com/search?q=on%20off

https://www.svgrepo.com/svg/533080/keyboard-alt?edit=true

#00ff11

#00ccff


    <Button
        onClick={() => adjustServo('1', 15, false)} // Относительное изменение
        className="bg-transparent hover:bg-gray-700/30 p-2 rounded-full transition-all flex items-center"
    >
        <img width={'25px'} height={'25px'} src="/arrow/arrow-up-2.svg" alt="+15°"/>
    </Button>

    <Button
        onClick={handleCloseControls}
        className="bg-transparent hover:bg-gray-700/30  border border-gray-600 p-2 rounded-full transition-all flex items-center"
    >
        {activeTab === 'controls' ? (
            <img width={'25px'} height={'25px'} src="/settings2.svg" alt="Image"/>
        ) : (
            <img width={'25px'} height={'25px'} src="/settings1.svg" alt="Image"/>
        )}
    </Button>


