// Проверка есть ли у этого объекта поле:
// 1
var obj = {"a": false}
obj.b = undefined
if ("a" in obj) {
    console.log("ключ 'a' присутствует в объекте obj, его расширение " + obj["a"])
} else {
}
if ("b" in obj) {
    console.log("ключ 'b' присутствует в объекте obj и его расширение " + obj["b"])
} else {
}

// 2
const hero = {
    name: 'Batman'
};

hero.hasOwnProperty('name');     // => true
hero.hasOwnProperty('realName'); // => false
