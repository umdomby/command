```js

console.log(JSON.parse(JSON.stringify(store.mongoMusic)))  
const arr = JSON.parse(JSON.stringify(store.mongoMusic))  
console.log(arr)  

for(let i = 0; i < arr.length; i++){  
    //a.includes(value)  
    //a.find(x => x.id === my_id)  
    //const double = el => el * 2  
    console.log(arr[i].link)  
}  

arr.forEach(function(entry) {  
    console.log(entry.link);  
});  

arr.map(function (name) {  
    console.log(name.link)  
})  

for (const value of arr) {  
    console.log(value.link);  
}  

//объединение массива
const a = [1, 2]  
const b = [3, 4]  
const c = a.concat(b)  
console.log(c) //[ 1, 2, 3, 4 ]  

//filter  
var arr = [1, -1, 2, -2, 3];  
var positiveArr = arr.filter(function(number) {  
    return number > 0;  
});  
alert( positiveArr ); // 1,2,3  

Object.keys(store.mongoMusic).map((item, index) => (  
    <div key={index}>  
        {console.log('link: ' + store.mongoMusic[item].link + ' - name ' + store.mongoMusic[item].name + ' - pl - ' + store.mongoMusic[item].pl)}  
    </div>  
))

store.mongoMusic.map((mongoMusic, index) =>  
    <div key={index}>  
        {console.log(mongoMusic.link)}  
    </div>  
)  

setTheArray(oldArray => [...oldArray, newElement]);
setTheArray([...theArray, newElement]);
```