function generateCardId() {
const length = 16; // Длина идентификатора, например, 16 цифр
let result = '';
for (let i = 0; i < length; i++) {
result += Math.floor(Math.random() * 10); // Добавляем случайную цифру
}
return result;
}

const newUser = await prisma.user.create({
data: {
email: 'example@example.com',
name: 'Example User',
cardId: generateCardId(), // Генерируем уникальный идентификатор
},
});