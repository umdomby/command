import { Ingredient, Product, ProductItem, GameRecords} from '@prisma/client';

export type ProductWithRelations = Product & { items: ProductItem[]; ingredients: Ingredient[]};