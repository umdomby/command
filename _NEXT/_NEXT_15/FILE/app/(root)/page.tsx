import {Container, TopBar} from '@/shared/components/shared';

import GameRecords_SERVER from "@/components/gameRecords_SERVER";

export const dynamic = 'force-dynamic'

export default async function Home() {


  return (
    <>

      <TopBar />

      {/*<Stories />*/}


      <Container className="mt-10 pb-14">

      {/*<CategoryMap/>*/}
      {/*    <GameRecords/>*/}
            <GameRecords_SERVER/>
        {/*<div className="flex gap-[80px]">*/}
          {/* Фильтрация */}
          {/*<div className="w-[250px]">*/}
          {/*  <Suspense>*/}
          {/*    /!*<Filters />*!/*/}

          {/*      /!*<LeftBlockLinkCategory />*!/*/}
          {/*  </Suspense>*/}
          {/*</div>*/}

          {/* Список товаров */}
          {/*<div className="flex-1">*/}
          {/*  <div className="flex flex-col gap-16">*/}
          {/*    {categories.map(*/}
          {/*      (category) =>*/}
          {/*        category.products.length > 0 && (*/}
          {/*          <ProductsGroupList*/}
          {/*            key={category.id}*/}
          {/*            title={category.name}*/}
          {/*            categoryId={category.id}*/}
          {/*            items={category.products}*/}
          {/*          />*/}
          {/*        ),*/}
          {/*    )}*/}
          {/*  </div>*/}
          {/*</div>*/}
        {/*</div>*/}
      </Container>
    </>
  );
}
