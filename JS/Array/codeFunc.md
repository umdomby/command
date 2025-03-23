```js
const editDeviceTimestate = async (id, timestate) => {
    console.log('id: ' + id + '  timestate: ' + timestate)
    let arrDataLocal = [{id, timestate, file}]
    let next = false
    if (refArr.current.length === 0) {
        refArr.current.push(...arrDataLocal)
        console.log(refArr.current[0].id + ' ' + refArr.current[0].timestate)
    } else {
        for (let i = 0; i < refArr.current.length; i++) {
            if (refArr.current[i].id === id) {
                refArr.current[i] = arrDataLocal[0]
                next = true
            }
        }
        if (next === false) {
            refArr.current.push(...arrDataLocal)
        }
    }
    for (let i = 0; i < refArr.current.length; i++) {
        console.log('frontend  ! ' + refArr.current[i].id + ' !! ' + refArr.current[i].timestate + ' !!! ' + refArr.current[i].file)
    }
    updateDevice(formDataRef.current).then(data => onHide()).then(()=> onHide())
}
```
