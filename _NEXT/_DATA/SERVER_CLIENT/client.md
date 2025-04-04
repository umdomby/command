# с client componentsвы не можете вызвать ожидаемую функцию напрямую (API Requests). 
# Поэтому вы должны использовать, useEffectчтобы все работало без проблем. Можете попробовать этот код:
```tsx
"use client"
import { useState, useEffect } from 'react';
import { Products, columns } from "@/app/store/columns";
import { DataTable } from "@/app/store/data-table";
import { getData } from "@/lib/store/get-product";
import { useProductPagination } from "@/lib/store/product-pagination";
import React from "react";

function StoreTable() {
    const { page, perPage } = useProductPagination();
    const [data, setData] = useState([]); // based on your data you should store it here in state

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getData(perPage, page);
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [perPage, page]);

    return (
        <div className="w-screen  pr-4 sm:pr-8 md:pr-10 max-w-7xl mx-auto">
            <DataTable data={data} columns={columns} />
        </div>
    );
}

export default StoreTable;

```