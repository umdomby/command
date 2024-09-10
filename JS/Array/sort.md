


```js
device.setDevices(data.rows.sort((a, b) => Number(a.timestate.replace(/[\:.]/g, '')) - Number(b.timestate.replace(/[\:.]/g, ''))))

```

```javascript
const numbers = [3, 1, 4, 1, 5];
const sorted = numbers.sort((a, b) => a - b);
// numbers and sorted are both [1, 1, 3, 4, 5]
```

```javascript
const sorted = numbers.sort((a, b) => a.data - b.data);
```