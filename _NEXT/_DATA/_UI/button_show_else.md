```tsx
    {
        items.length > limit && (
            <div className={showAll ? 'border-t border-t-neutral-100 mt-4-All' : ''}>
                <button onClick={() => setShowAll(!showAll)} className="text-primary mt-3">
                    {showAll ? 'Скрыть' : '+ Показать все'}
                </button>
            </div>
        )
    }   
```