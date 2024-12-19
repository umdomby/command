```javascript
import React, {useState} from 'react';

function Submit() {

    const [inputField , setInputField] = useState({
        first_name: '',
        last_name: '',
        gmail: ''
    })

    const inputsHandler = (e) =>{
        setInputField( {[e.target.name]: e.target.value} )
    }

    const submitButton = () =>{
        alert(inputField.first_name)
    }

    return (
        <div>
            <input 
            type="text" 
            name="first_name" 
            onChange={inputsHandler} 
            placeholder="First Name" 
            value={inputField.first_name}/>

            <br/>

            <input 
            type="text" 
            name="last_name" 
            onChange={inputsHandler} 
            placeholder="First Name" 
            value={inputField.last_name}/>

            <br/>

            <input 
            type="gmail" 
            name="gmail" 
            onChange={inputsHandler} 
            placeholder="Gmail" 
            value={inputField.gmail}/>

            <br/>

            <button onClick={submitButton}>Submit Now</button>
        </div>
    )
}

export default Submit
```