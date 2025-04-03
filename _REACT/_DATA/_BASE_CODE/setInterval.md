setInterval позволяет вызывать функцию регулярно, повторяя вызов через определённый интервал времени.
```js
useEffect(() => {
        const interval = setInterval(() => {
            console.log('This will run every second!');
        }, 1000);
    return () => clearInterval(interval);
}, []);
```