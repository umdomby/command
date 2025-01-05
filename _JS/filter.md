```tsx
{
    carModelArrayState
        .filter((item) => item.productId === records.productId) // Filter by records.productId
        .map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
            </SelectItem>

        ))
}
```

```
//unique Object .pl 
.filter((v,i,a)=>a.findIndex(v2=>(v2.pl===v.pl))===i)
```
