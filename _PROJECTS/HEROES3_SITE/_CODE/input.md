```js
<Input
    type="text"
    value={points}
    onChange={(e) => {
        const value = e.target.value;
        // Удаляем все символы, кроме цифр
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        // Удаляем ведущие нули
        const cleanedValue = sanitizedValue.replace(/^0+(?=\d)/, '');
        setPoints(cleanedValue === '' ? 0 : Number(cleanedValue));
    }}
    onBlur={() => {
        if (points < 30) {
            setErrorMessage('Минимальное количество баллов для передачи - 30');
        } else {
            setErrorMessage('');
        }
    }}
    placeholder="Количество баллов"
    required
    className="w-full"
/>
```