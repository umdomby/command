```js
const value = []
const sendMusicMongo = (link) => {

}
<div>
    {value.map((mongoMusic, index) =>
        <div key={index} style={{color:'red', width:'250px'}}>
            <button onClick={()=>sendMusicMongo(mongoMusic.link)}>{mongoMusic.name}</button>
        </div>
    )}
</div>

```

```tsx
    import {Category} from '@prisma/client';

    const [categories, setCategories] = React.useState<Category[]>(category);
    const [categories2, setCategories2] = React.useState<Category[]>(category);
    
    {categories.map((item, index) => (
        <div key={item.id} className="flex w-full max-w-sm items-center space-x-2 mb-1">
            <p>{item.id}</p>
            <Input type='text'
                   defaultValue={item.name}
                   onChange={e => eventHandler(categories[index], e.target.value)
                   }/>
            <Button
                type="submit"
                disabled={categories[index].name === categories2[index].name}
                onClick={() => eventSubmitUpdate(categories2[index])}
            >Up</Button>
            <Button
                type="submit"
                onClick={() => eventSubmitDelete(item.id)}
            >Del</Button>
        </div>
    ))}
```


