```tsx
const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });
const category = await prisma.
```

import { ICategory } from '@/shared/services/categories';
const [categories, setCategories] = React.useState<ICategory []>([]);