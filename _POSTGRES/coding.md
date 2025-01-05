# models
https://github.com/umdomby/cyberbet/blob/master/cyberbet-backend/models/models.js

```js

const Chat = sequelize.define('chat', {
id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
username: {type: DataTypes.STRING, unique: false, allowNull: false},
message: {type: DataTypes.STRING, unique: false, allowNull: false},
date: {type: DataTypes.DATE, unique: false, allowNull: true},
})

const Brand = sequelize.define('brand', {
id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
idname: {type: DataTypes.INTEGER, allowNull: true},
name: {type: DataTypes.STRING, unique: false, allowNull: false},
brand_description: {type: DataTypes.STRING, unique: false, allowNull: false},
amount: {type: DataTypes.INTEGER, allowNull: true},
brand_payment: {type: DataTypes.INTEGER, allowNull: true},
})

```

# query
https://github.com/umdomby/cyberbet/tree/master/cyberbet-backend/controllers
