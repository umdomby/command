```tsx

const [showAll, setShowAll] = React.useState(false);

<button onClick={() => setShowAll(!showAll)} className="text-primary mt-3">
    {showAll ? 'Скрыть' : '+ Показать все'}
</button>
```