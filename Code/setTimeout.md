if(rjHoriz > 0.11 || rjVert > 0.11 || rjHoriz < -0.11 || rjVert < -0.11) {  
    refTimeout.current = 1000  
    refTimeoutBool.current = true  
    const map = (x, in_min, in_max,out_min, out_max)=> {  
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;  
    }  
    refRjHoriz.current = map(rjHoriz, 0, 1, 90, 180);  
    refRjVert.current = map(rjVert, 0, 1, 90, 180);  
    store.webSocket.send(JSON.stringify({  
        id: store.idSocket,  
        method: 'messageFBLLRR',  
        messageLL: refRjHoriz.current,  
        messageRR: refRjVert.current  
    }))  
    console.log('refRjHoriz.current ' + refRjHoriz.current)  
    console.log('refRjVert.current ' + refRjVert.current )  
}else{  
    refTimeoutBool.current = false  
}  

if (refTimeoutBool.current === true && refTimeoutBool2.current === true) {  
    refTimeoutBool2.current = false  
    refTimeoutBool.current = false  
    setTimeout(() => {  
        store.webSocket.send(JSON.stringify({  
        id: store.idSocket,  
        method: 'messageFBLLRR',  
        messageLL: 90,  
        messageRR: 90  
        }))  
    refTimeoutBool2.current = true  
    }, refTimeout.current)  
}  
