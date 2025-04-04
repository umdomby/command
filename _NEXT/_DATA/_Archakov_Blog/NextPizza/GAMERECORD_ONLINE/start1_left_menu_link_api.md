# FILTERS
# \\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\components\shared\filters.tsx

# HOOKS
\\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\hooks\use-ingredients.ts -->
\\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\hooks\use-categories.ts
```jsx
import { Api } from '@/shared/services/api-client';
import { Category } from '@prisma/client';
import React from 'react';

export const useCategories = () => {
    const [categories, setCategories] = React.useState<Category[]>([]);

    React.useEffect(() => {
        async function fetchCategories() {
            try {
                const categories = await Api.categories.getAll();
                setCategories(categories);
            } catch (error) {
                console.log(error);
            } finally {
            }
        }
        fetchCategories();
    }, []);

    return {
        categories,
    };
};
```

# SERVICE
\\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\hooks\use-categories.ts
```jsx
import { axiosInstance } from './instance';
import { ApiRoutes } from './constants';
import { Category } from '@prisma/client';

export const getAll = async (): Promise<Category[]> => {
  return (await axiosInstance.get<Category[]>(ApiRoutes.CATEGORIES)).data;
};
```

# API
\\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\app\api\categories\route.ts
```jsx
import { prisma } from '@/prisma/prisma-client';
import { NextResponse } from 'next/server';

export async function GET() {
    const categories = await prisma.category.findMany();

    return NextResponse.json(categories);
}

```

# COMPONENTS
\\wsl$\Ubuntu\home\pi\Projects\gamerecord_online\shared\components\shared\filters.tsx
```jsx
<div className={className}>
    <div>
        {categories.map(category =>
            <div
                onClick={() => console.log(category.name)}
                key={category.id}
            >
                {category.name}
            </div>
        )}
    </div>
</div>
```