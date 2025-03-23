```tsx .toFixed(2)
const num = 123.456;
const rounded = num.toFixed(2); // "123.46"
```
```tsx Math.round
    const num = 123.456;
    const rounded = Math.round(num * 100) / 100; // 123.46
```
```tsx Math.floor Если вам нужно округлить число без округления, то есть просто отбросить дробную часть, вы можете использовать Math.floor:
    const num = 123.456;
    const floored = Math.floor(num * 100) / 100; // 123.45
```
```tsx Math.ceil Math.ceil: Округляет число вверх до ближайшего целого числа.
    const num = 123.456;
    const ceiled = Math.ceil(num * 100) / 100; // 123.46
```

```
Для сравнения чисел с плавающей запятой лучше использовать метод, который учитывает погрешности вычислений. 
В вашем коде уже используется функция areNumbersEqual, которая сравнивает числа с учетом небольшой погрешности:
```
```tsx 
function areNumbersEqual(num1: number, num2: number): boolean {
    return Math.abs(num1 - num2) < Number.EPSILON;
}
```
```tsx
```
```tsx
```
можно для точности для всех значений сделать без округления, то есть просто отбросить дробную часть, вы можете использовать Math.floor:

добавь еще один выход из цикла, дополнительно, остальные не удаляй const participantsPlayer1 = participants.filter(p => p.player === PlayerChoice.PLAYER1); const participantsPlayer2 = participants.filter(p => p.player === PlayerChoice.PLAYER2); посчитай количество значений в фильтре, и когда цикл while просчитает все количества значений, так же выходит из цикла