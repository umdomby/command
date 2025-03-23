```tsx find_replace_field
    const eventHandler = (categoryIndex: any, value: any) => {
    setCategories2(
        categories.map((item) =>
            item.id === categoryIndex.id ? {...item, name: value} : item
        )
    )
};
```
