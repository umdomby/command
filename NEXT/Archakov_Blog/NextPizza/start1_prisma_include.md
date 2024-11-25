```jsx
    const gameRecords = await prisma.gameRecords.findMany({
    include: {
        user: true,
    }
});
```