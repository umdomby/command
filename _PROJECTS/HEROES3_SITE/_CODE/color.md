type TitleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
xs: 'text-[16px]',
sm: 'text-[22px]',
md: 'text-[26px]',
lg: 'text-[32px]',
xl: 'text-[40px]',
'2xl': 'text-[48px]',


Основные цвета:
text-black
text-white
text-transparent
text-current


Оттенки серого:
text-slate
text-gray
text-zinc
text-neutral
text-stone

        <span
            className={`absolute top-0 left-1 transform -translate-x-1 -translate-y-1 text-xs p-1 rounded shadow ${
                bet?.description === 'online' ? 'text-green-500' : 'text-red-500'
            }`}
        >
        № {bet.id}-4
            {" "}{bet?.description}
            <span className="text-amber-500">
            {bet.category && (
                <span> {bet.category.name}</span>
            )}
                {bet.product && (
                    <span> {bet.product.name}</span>
                )}
                {bet.productItem && (
                    <span> {bet.productItem.name}</span>
                )}
        </span>
          </span>
        <span className="text-green-600 absolute right-1 transform -translate-y-12 text-xs">
            {new Date(bet.createdAt).toLocaleString()}
        </span>


Цветовые варианты:
text-red-500
text-orange-500
text-amber-500
text-yellow-500
text-lime-500
text-green-500
text-emerald-500
text-teal-500
text-cyan-500
text-sky-500
text-blue-500
text-indigo-500
text-violet-500
text-purple-500
text-fuchsia-500
text-pink-500
text-rose-500