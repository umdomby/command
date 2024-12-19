```tsx
import { useRef } from 'react';

  const intervalRef = useRef(0);
  const inputRef = useRef(null);
  
  intervalRef.current = intervalId;
  inputRef.current = "1111";
```