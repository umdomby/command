# https://stackoverflow.com/questions/7364150/search-an-array-of-javascript-objects-for-an-object-with-a-matching-value

# find one
```tsx
    setProductSetFind(productSetFind.find(item => item.categoryId === id));
```

```tsx
const [productSet, setProductSet] = React.useState<Product[]>(product);
const [productSetFind, setProductSetFind] = React.useState<Product[]>();

const productItem = (id) => {
    let array = []
    for( let i = 0; i < productSet.length; i ++){
        if(productSet[i].categoryId === id){
            array.push(productSet[i]);
        }
    }
    setProductSetFind(array);
}
```