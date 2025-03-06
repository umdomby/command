yarn add --dev jest @types/jest ts-jest

Создайте файл jest.config.js в корне вашего проекта, если его еще нет, и добавьте следующую конфигурацию:

```js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};
```
yarn add next-auth


