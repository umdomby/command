```js
    useEffect(() => {
        const timeOutId = setTimeout(() => {
            setIdSocket(displayMessage)
            localStorage.setItem('localIdSocket', displayMessage)
            setIdSocket(displayMessage)
            store.setIdSocket(displayMessage)
        }, 1500);
        return () => clearTimeout(timeOutId);
    }, [displayMessage]);
```

```js
    <input
           type='text'
           disabled={false}
           style={{backgroundColor: '#D3D3D3', textAlign: 'center', borderWidth: 1, fontSize: 12, width:'15em', height:'1.5em'}}
           value={displayMessage}
           onChange={event => setDisplayMessage(event.target.value)}
    />
```