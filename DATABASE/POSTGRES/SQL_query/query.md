create
```javascript
const dev_brandname = await db.query('SELECT * FROM brands WHERE id = $1', [brandId])
const device = await Device.create({brandId, typeId, userId, userdatumId, dev_username:dev_username.rows[0].username, dev_typename:dev_typename.rows[0].nametype, dev_amount:dev_typename.rows[0].amount, dev_brandname:dev_brandname.rows[0].name, dev_start:false, dev_billid:billId});
if (info) {
info = JSON.parse(info)
info.forEach(i =>
DeviceInfo.create({
title: i.title,
description: i.description,
deviceId: device.id
})
)
}
return res.json(device)
```

```javascript
const brands = await db.query('SELECT * FROM brands WHERE idname = $1', [typeId])
    for(var a = 0; a < brands.rows.length; a++){
        const device = await Device.create({brandId:brands.rows[a].id, typeId, userId, userdatumId, dev_username:dev_username.rows[0].username, dev_typename:dev_typename.rows[0].nametype, dev_amount:dev_typename.rows[0].amount, dev_brandname: brands.rows[a].name, dev_start:false, dev_billid:billId});
        deviceMassive.push(device)
    }
    return res.json(deviceMassive)
```