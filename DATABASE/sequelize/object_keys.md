```javascript
        const userAllTypeField = await User.findOne(
    { attributes: {exclude: ['id', 'ip', 'email', 'point', 'password', 'role','createdAt', 'updatedAt']}})

    console.log(Object.keys(userAllTypeField.dataValues))
    console.log(Object.keys(userAllTypeField.dataValues)[3])
    console.log(Object.keys(userAllTypeField.dataValues).length)

    //result:
    // [
    // 'nfsmostwanted2005',
    //     'nfsmostwanted20055laps',
    //     'nfsshift',
    //     'nfsunderground',
    //     'nfscarbon',
    //     'allmedal'
    // ]

    // nfsunderground

    // 6


    for(let i = 0; i < Object.keys(userAllTypeField.dataValues).length; i++) {
        console.log(Object.keys(userAllTypeField.dataValues)[i])
    }
    //result
    // nfsmostwanted2005
    // nfsmostwanted20055laps
    // nfsshift
    // nfsunderground
    // nfscarbon
    // allmedal

```


