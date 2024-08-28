Смотрите пример с https://reacttraining.com/blog/react-router-v6-pre/

```js
import React from 'react';
import {useNavigate} from 'react-router-dom';

function App() {
    let navigate = useNavigate();
    let [error, setError] = React.useState(null);

    async function handleSubmit(event) {
        event.preventDefault();
        let result = await submitForm(event.target);
        if (result.error) {
            setError(result.error);
        } else {
            navigate('success');
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            // ...
        </form>
    );
}
```