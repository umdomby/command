нужна программа C# с HTTP сервером внутри - localhost:80. В программе должно быть 100 бочек (сделай этот список в левой стороне программы в выпадающем списке 001, 002, 003, ... 100), при выборе бочки - справа показывается информация из JSON данной бочки

пример

"NomenclatureName": "ПИНО ФРАН в/м натур. сухой обр. красный",     "TypeDOC": "Ассамбляж",     "NumberDOC": "41",     "volumePassport": 1595.2,     "QDal": 1558,     "Available": 37.2 ( в столбик), так же сделай 100 QR кодов для каждой бочки, так же выводи
QR коды с информацией о бочке вправой части снизу под информацией.
Когда пользователь наводит QR приложение, нужно чтобы у него сразу автоматически сразу открывалося браузер с информацией о бочке на которую он навел.
localhost/api/001
localhost/api/002
localhost/api/003
localhost/api/004
...
localhost/api/100

####

```
        private string GenerateHtmlPage(Barrel barrel)
        {
            return $@"
<!DOCTYPE html>
<html lang='ru'>
<head>
    <meta charset='utf-8'>
    <title>Бочка {barrel.NumberContent}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f0f2f5; }}
        .container {{ max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; text-align: center; }}
        .info p {{ font-size: 18px; line-height: 1.8; margin: 12px 0; }}
        .label {{ font-weight: bold; color: #34495e; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='info'>
            <p><span class='label'>Номер ёмкости:</span> {barrel.NumberContent}</p>
            <p><span class='label'>Наименование:</span> {barrel.NomenclatureName}</p>
            <p><span class='label'>Тип:</span> {barrel.TypeDOC}</p>
            <p><span class='label'>Номер:</span> {barrel.NumberDOC}</p>
            <p><span class='label'>Вместимость:</span> {barrel.volumePassport:F1} литров</p>
            <p><span class='label'>Фактическое количество:</span> {barrel.QDal}</p>
            <p><span class='label'>Свободно:</span> {barrel.Available:F1} литров</p>
        </div>
    </div>
</body>
</html>";
        }
```
это будет отображаться в телефоне
поэтому убери всеотступы и сделай текст большим на всю ширину экрана, чтобы текст не залазил за экран.

тут 7 элементов

сделай каждый элемент своим цветом <p><span class='label'>Номер ёмкости:</span> {barrel.NumberContent}</p>
Номер ёмкости: и данные {barrel.NumberContent} делай с новой строчки (для большей видимости)
Номер ёмкости: - с новой строчки, {barrel.NumberContent} - с новой строчки  - это все один элемент делай их разными цветами


Фактическое количество: чтобы это словосочетание отображалось
Фактическое - с новой строчки
количество - с новой строчки
{barrel.QDal} - с новой строчки 

элементы отображай по центру, минимальные отступы слева и справа, текст большой чтобы был виден в мобльном браузере, 
делай уклон на большой размер текста, ширину сделай 100% - чтобы все было ровно на любом мобильном устройстве
