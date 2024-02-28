```js
const [myId, setMyId] = useState(localStorage.getItem('myId') || '')

<input value={myId} onInput={e => setMyId(e.target.value)}/>

<button onClick={()=> localStorage.setItem('myId', myId)}>CONNECT</button>
 ```