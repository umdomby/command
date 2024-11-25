# HOOKS
# \\wsl$\Ubuntu\home\pi\Projects\next-pizza\shared\hooks\use-filters.ts
```jsx
  return React.useMemo(
    () => ({
        sizes,
        pizzaTypes,
        selectedIngredients,
        prices,
        setPrices: updatePrice,
        setPizzaTypes: togglePizzaTypes,
        setSizes: toggleSizes,
        setSelectedIngredients: toggleIngredients,
    }),
    [sizes, pizzaTypes, selectedIngredients, prices],
);
```