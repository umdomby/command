const array = [1, 3, 4, 5, 1, 7, 9, 0]

let sum = array.reduce((acc, next) => acc + next)
console.log(sum)
//or
let sum2 = 0
for(let i = 0; i < array.length; i++){
    sum2 += array[i]
}
console.log(sum2)