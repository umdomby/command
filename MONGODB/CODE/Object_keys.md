```js
{Object.keys(messagesMongo).map((item, index) => (
    <div key={index}>
        {'user: ' + messagesMongo[item].user + ' - ' + messagesMongo[item].messages}
    </div>
))}
```

