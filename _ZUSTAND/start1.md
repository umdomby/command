# https://zustand.docs.pmnd.rs/getting-started/introduction

```tsx
import {create} from 'zustand'

const useStore = create((set) => ({
    bears: 0,
    increasePopulation: () => set((state) => ({bears: state.bears + 1})),
    removeAllBears: () => set({bears: 0}),
    updateBears: (newBears) => set({bears: newBears}),
}))
```
