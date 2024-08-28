setTimeout позволяет вызвать функцию один раз через определённый интервал времени.

```js
    useEffect(() => {
        const timeout = setTimeout(() => {
            console.log('This will run every second!');
        }, 1500);
    return () => clearTimeout(timeout);
}, [displayMessage]);
```