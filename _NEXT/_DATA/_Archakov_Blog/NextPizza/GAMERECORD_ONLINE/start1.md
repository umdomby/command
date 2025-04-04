# \\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\components\shared\product-card.tsx
```jsx
        <div className="flex justify-between items-center mt-4">
          <span className="text-[20px]">
            от <b>{price} ₽</b>
          </span>

    <Button variant="secondary" className="text-base font-bold">
        <Plus size={20} className="mr-1" />
        Добавить
    </Button>
</div>
```


# \\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\app\(root)\product\[id]\page.tsx
```jsx
<Button
    loading={loading}
    onClick={() => onSubmit?.()}
    className="h-[55px] px-10 text-base rounded-[18px] w-full mt-10">
    Добавить в корзину за {price} ₽
</Button>
```

# \\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\components\shared\sort-popup.tsx
```jsx
      <ArrowUpDown size={16} />
<b>Сортировка:</b>
<b className="text-primary">популярное</b>
```