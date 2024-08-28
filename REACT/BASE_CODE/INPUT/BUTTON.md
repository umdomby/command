```js
<button onClick={e => e.stopPropagation()}> 123 </button>

<Button
    variant={"outline-success"}
    onClick={()=> {localStorage.setItem('pass', email); click()}}
>
    {isLogin ? 'Войти' : 'Регистрация'}
</Button>
```