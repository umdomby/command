```typescript  
constructor(private db: DbService) {}

async create(userId: number) {
    return this.db.account.create({
        data: {
            ownerId: userId,
            isBlockingEnabled: false,
        },
    });
}
```

```typescript
  getByUser(userId: number, query: BlockListQueryDto) {
    return this.db.blockList.findUniqueOrThrow({
        where: { ownerId: userId },
        include: {
            items: {
                where: { data: { contains: query.q, mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
}
```

```typescript
  async removeItem(userId: number, itemId: number) {
    const blockList = await this.db.blockList.findUniqueOrThrow({
      where: { ownerId: userId }, //удалить собственный блок лист
    });

    return this.db.blockItem.delete({
      where: {
        blockListId: blockList.id,
        id: itemId,
      },
    });
  }
```

