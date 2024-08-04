, order: [['timestate']]

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
