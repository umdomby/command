```
catch (error) {
        if (error === null || error === undefined) {
            console.error('error === null || error === undefined');
        } else if (error instanceof Error) {
            console.error('Ошибка :', error.message);
            console.error('Стек ошибки:', error.stack);
        } else {
            console.error('Ошибка else:', error);
        }
        throw new Error('throw new Error');
    }
```