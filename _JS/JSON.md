JSON.stringify для преобразования объектов в JSON.
JSON.parse для преобразования JSON обратно в объект.


```js
        let student = {
            name: 'John',
            age: 30,
            isAdmin: false,
            courses: ['html', 'css', 'js'],
            wife: null
        };

        let json = JSON.stringify(student);
        let json2 = JSON.parse(json);
```

json {"name":"John","age":30,"isAdmin":false,"courses":["html","css","js"],"wife":null}
json2 [object Object]
