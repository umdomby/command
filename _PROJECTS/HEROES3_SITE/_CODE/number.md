```js
 name="price"
label="Цена за 1 Point"
value={newBankDetail.price || ''} // Ensure the value is always a string
onChange={(e) => {
    let value = e.target.value;
    // Заменяем точку на запятую
    value = value.replace('.', ',');
    // Проверяем, соответствует ли значение регулярному выражению
    const regex = /^\d*[,]?\d*$/;
    if (regex.test(value)) {
        // Если значение пустое, сбрасываем цену
        if (value === '') {
            setEditedDetail({...editedDetail, price: ''});
            return;
        }
        // Если значение начинается с запятой или точки, добавляем "0," в начало
        if (value.startsWith(',') || value.startsWith('.')) {
            value = '0,' + value.slice(1);
        }
        // Если значение начинается с "0" и за ним не следует запятая, добавляем запятую
        if (value.startsWith('0') && value.length > 1 && value[1] !== ',') {
            value = '0,' + value.slice(1);
        }
        // Предотвращаем добавление второй запятой после "0,0"
        if (value.startsWith('0,') && value[3] === ',') {
            value = '0,' + value.slice(4);
        }
        // Предотвращаем добавление второй запятой после "0,0"
        if (value.startsWith('0,') && value[4] === ',') {
            value = '0,' + value.slice(5);
        }
        // Разделяем значение на части до и после запятой
        const parts = value.split(',');
        // Ограничиваем длину части до запятой и проверяем, не превышает ли она 100000
        if (parts[0].length > 6 || parseInt(parts[0]) > 100000) {
            parts[0] = parts[0].slice(0, 6);
            if (parseInt(parts[0]) > 100000) {
                parts[0] = '100000';
            }
        }
        // Ограничиваем длину части после запятой
        if (parts[1] && parts[1].length > 10) {
            parts[1] = parts[1].slice(0, 10);
        }
        // Объединяем части обратно в строку
        value = parts.join(',');

        // Преобразуем строку в число с плавающей точкой и проверяем, является ли оно числом
        const floatValue = parseFloat(value.replace(',', '.'));
        if (!isNaN(floatValue)) {
            setNewBankDetail({...newBankDetail, price: value});
        }
    }
}}
```