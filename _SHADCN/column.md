```tsx 2-column
<div className="flex flex-col gap-3 w-full mt-10 px-0"> {/* Убираем горизонтальные отступы */}
  <div className="flex gap-3 w-full">
    <div className="w-1/2 p-4 border border-gray-300 rounded-lg">
      123123
    </div>
    <div className="w-1/2 p-4 border border-gray-300 rounded-lg">
      456456
    </div>
  </div>
</div>
```

```tsx column
<div className="flex flex-col gap-3 w-full mt-10">
  <div className="flex flex-col md:flex-row gap-3 w-full"> {/* flex-col на мобильных, flex-row на десктопах */}
    <div className="w-full md:w-1/2 p-4 border border-gray-300 rounded-lg"> {/* w-full на мобильных, w-1/2 на десктопах */}
      123123
    </div>
    <div className="w-full md:w-1/2 p-4 border border-gray-300 rounded-lg"> {/* w-full на мобильных, w-1/2 на десктопах */}
      456456
    </div>
  </div>
</div>
```