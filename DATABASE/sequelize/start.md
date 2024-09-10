https://dbasedev.ru/orm/sequelize/#_5

https://my-js.org/docs/guide/sequelize/
https://sequelize.org/docs/v7/querying/update/

```javascript
// Изменяем имя пользователя с `userId = 2`
await Device.update(
    { name: 'NFS Most Wanted 2005' },
    {
        where: {name: 'NFS Most Wanted'},
    },
);
```

```javascript
    const result2 = await Device.findAll({
        where: {name: 'NFS Most Wanted 2005'},
        attributes: ['timestate']
    })
    console.log(result2)
```
# operators https://sequelize.org/docs/v7/querying/operators/
# группировка   не принимает направление 

# order

```javascript
//Сортировка и группировка
//Настройка order определяет порядок сортировки возвращаемых объектов:
Submodel.findAll({
  order: [
    // Сортировка по заголовку (по убыванию)
    ['title', 'DESC'],

    // Сортировка по максимальному возврасту
    sequelize.fn('max', sequelize.col('age')),

    // То же самое, но по убыванию
    [sequelize.fn('max', sequelize.col('age')), 'DESC'],

    // Сортировка по `createdAt` из связанной модели
    [Model, 'createdAt', 'DESC'],

    // Сортировка по `createdAt` из двух связанных моделей
    [Model, AnotherModel, 'createdAt', 'DESC'],

    // и т.д.
  ],

  // Сортировка по максимальному возврасту (по убыванию)
  order: sequelize.literal('max(age) DESC'),

  // Сортировка по максимальному возрасту (по возрастанию - направление сортировки по умолчанию)
  order: sequelize.fn('max', sequelize.col('age')),

  // Сортировка по возрасту (по возрастанию)
  order: sequelize.col('age'),

  // Случайная сортировка
  order: sequelize.random(),
})

Model.findOne({
  order: [
    // возвращает `name`
    ['name'],
    // возвращает `'name' DESC`
    ['name', 'DESC'],
    // возвращает `max('age')`
    sequelize.fn('max', sequelize.col('age')),
    // возвращает `max('age') DESC`
    [sequelize.fn('max', sequelize.col('age')), 'DESC'],

    // и т.д.
  ],
})
```

```js

const Device = sequelize.define('device', {
id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
username: {type: DataTypes.STRING, unique: false, allowNull: false},
name: {type: DataTypes.STRING, unique: false, allowNull: false},
description: {type: DataTypes.STRING, unique: false, allowNull: false},
// timestr: {type: DataTypes.STRING, unique: false, allowNull: false},
timestate: {type: DataTypes.STRING, unique: false, allowNull: false},
linkvideo: {type: DataTypes.STRING, unique: false, allowNull: false},
// price: {type: DataTypes.INTEGER, allowNull: false},
// rating: {type: DataTypes.INTEGER, defaultValue: 0},
img: {type: DataTypes.STRING, allowNull: false},
})

```
