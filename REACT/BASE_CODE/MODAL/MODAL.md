```js
import Modal from 'react-modal'
```
```js
    const [showModal, setShowModal] = useState(false)
    const delMusicRef = useRef()

    const sendMusicMongoDel = (_id) => {
        store.webSocket.send(JSON.stringify({
            id: store.idSocket,
            method: 'mongoMusicDel',
            message: _id
        }))
}
```
```js
 <div className='jook-container'>
    <Modal
        className="modal-my"
        style={customStyles}
        ariaHideApp={false}
        isOpen={showModal}
        onRequestClose={()=>setShowModal(false)}
    >
        <button onClick={()=> {
            sendMusicMongoDel(delMusicRef.current)
            setShowModal(false)
        }
        }>Да</button>
        <button onClick={()=>setShowModal(false)} style={{marginLeft: '5px'}}>Нет</button>
        <span style={{marginLeft: '15px'}}>Удалить?</span>
    </Modal>

    <button onClick={()=>{
        delMusicRef.current = mongoMusic._id
        setShowModal(true)
    }}>Dell</button>
</div>
```

```
    const customStyles = {
        // content : {
        //     ...
        // },
        overlay: {
            zIndex: 999999999,
            backgroundColor: 'transparent'
        }
    };
```

```
.modal-my {
  z-index: 1000000;
  background-color: #fefefe;
  margin: 15% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 20%; /* Could be more or less, depending on screen size */
}
```

```
.jook-container{
    margin-left: 75%;
    margin-top: 0%;
    width: 10%;
    position: absolute;
    z-index: 999999;
    /*margin-left: auto;*/
    /*margin-right: auto;*/
}
```