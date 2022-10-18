```js
const value = []
const sendMusicMongo = (link) => {

}
<div>
    {value.map((mongoMusic, index) =>
        <div
            style={{color:'red', width:'250px'}}
            key={index}
        >
            <button onClick={()=>sendMusicMongo(mongoMusic.link)}>{mongoMusic.name}</button>
        </div>
    )}
</div>

```

