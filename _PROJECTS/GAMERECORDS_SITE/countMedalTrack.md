```javascript
async medal(req, res, next)
{
    try {

        let {typename} = req.body
        const TRACKresult = await Brand.findAll({where: {name: typename}, attributes: ['id', 'description']})
        const result = await Device.findAll({where: {name: typename}})
        const USERS = await User.findAll({attributes: ['email']})

        let arrayNoSortTRACK = []
        let sortedThreeArrayNoSortTRACK = []
        let medalGold = []
        let medalSilver = []
        let medalBronze = []
        let medalPlatinum = []

        for (let i = 0; i < TRACKresult.length; i++) {
            arrayNoSortTRACK = []
            for (let b = 0; b < result.length; b++) {
                if (TRACKresult[i].description === result[b].description) {
                    arrayNoSortTRACK.push({
                        username: result[b].username,
                        timestate: result[b].timestate,
                        description: result[b].description
                    })
                }
            }
            sortedThreeArrayNoSortTRACK = arrayNoSortTRACK.sort((a, b) => Number(a.timestate.replace(/[\:.]/g, '')) - Number(b.timestate.replace(/[\:.]/g, '')));
            sortedThreeArrayNoSortTRACK.splice(3)

            for (let i = 0; i < USERS.length; i++) {
                //console.log(USERS[i].email)
                let equals = 0
                for (let k = 0; k < sortedThreeArrayNoSortTRACK.length; k++) {
                    if (sortedThreeArrayNoSortTRACK[k].username === USERS[i].email) {
                        equals = equals + 1
                        //console.log(equals + ' ' + sortedThreeArrayNoSortTRACK[k].description)
                        if (equals === 3) {
                            //console.log("Platinum " + USERS[i].email)
                            medalPlatinum.push({username: USERS[i].email})
                        }
                    }
                }
            }
            if (sortedThreeArrayNoSortTRACK[0] !== undefined) medalGold.push(sortedThreeArrayNoSortTRACK[0])
            if (sortedThreeArrayNoSortTRACK[1] !== undefined) medalSilver.push(sortedThreeArrayNoSortTRACK[1])
            if (sortedThreeArrayNoSortTRACK[2] !== undefined) medalBronze.push(sortedThreeArrayNoSortTRACK[2])
        }

        let countGold = []
        let countSilver = []
        let countBronze = []
        let countPlatinum = []

        for (let i = 0; i < USERS.length; i++) {
            countGold.push({
                username: USERS[i].email,
                medal: medalGold.filter(item => item.username === USERS[i].email).length
            })
        }
        for (let i = 0; i < USERS.length; i++) {
            countSilver.push({
                username: USERS[i].email,
                medal: medalSilver.filter(item => item.username === USERS[i].email).length
            })
        }
        for (let i = 0; i < USERS.length; i++) {
            countBronze.push({
                username: USERS[i].email,
                medal: medalBronze.filter(item => item.username === USERS[i].email).length
            })
        }
        for (let i = 0; i < USERS.length; i++) {
            countPlatinum.push({
                username: USERS[i].email,
                medal: medalPlatinum.filter(item => item.username === USERS[i].email).length
            })
        }

        let medalUsersFull = []

        for (let i = 0; i < USERS.length; i++) {
            medalUsersFull.push({
                username: USERS[i].email,
                gold: countGold[i].medal,
                silver: countSilver[i].medal,
                bronze: countBronze[i].medal,
                platinum: countPlatinum[i].medal
            })
        }

        const typeNameColumn = typename.replace(/\s+/g, '').toLowerCase();

        for (let i = 0; i < medalUsersFull.length; i++) {
            await User.findOne({where: {email: medalUsersFull[i].username}}).then(record => {
                record.update({[typeNameColumn]: JSON.stringify(medalUsersFull[i])}).then(updatedRecord => {
                    console.log(`updated record ${JSON.stringify(updatedRecord, null, 2)}`)
                })
            })
        }
    } catch (e) {
        console.log(e)
    }
}
```