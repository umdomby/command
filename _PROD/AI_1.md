ось Z alpha не точно отображает данные по вращение по горизонтали - где должен показываться угол от 0 до 360 градусов
ось Y gamma хорошо и правильно отображает данные
я тестирую телефон в горизонтальном положении, мне нужно горизонтальное положение телефона для оси Z alpha правильное отображение.
Не отображает правильно ни в iPhone ни в Android
(ландшафтная ориентация) экраном вверх ось Z alpha (азимут) хорошо правильно показывает данные, но когда телефон повернут человеку экраном (ландшафтная ориентация), 
то данные оси Z alpha (азимут) искажаются

    const correctAlpha = (alpha: number): number => {
        const orientation = screen.orientation?.type || "";

        switch (orientation) {
            case "landscape-primary":
                return (alpha + 90) % 360;
            case "landscape-secondary":
                return (alpha + 270) % 360;
            case "portrait-secondary":
                return (alpha + 180) % 360;
            case "portrait-primary":
            default:
                return alpha;
        }
    };

screen.orientation?.type || ""; не помогает скорректировать отображаемые данные Z alpha
можно скорректировать не от screen.orientation?.type а от других параметров или датчиков, например осей Y gamma и X beta 


отвечай на русском, дай полный код