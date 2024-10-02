npx create-next-app client
App Router - No
Alias - No

http://localhost:3000/api-yaml

# use orval.dev generate api ts
openapi-generator.tech - более широкий инструмент

npm i -D orval
npm i axios
```json
{
  "scripts": {
    "api:download": "wget http://localhost:3000/api-yaml -O ./src/shared/api/schema.yaml"
  }
}
```

# download swagger generate
$ npm run api:download  

# start orval
$ npm run api:generate

# src/shared/api/api-instance.ts
generate my return data, My api

# start orval test work
$ npm run api:generate

# orval.config.js
```js
module.exports = {
  main: {
    input: "./src/shared/api/schema.yaml",
    output: {
      target: "./src/shared/api/generated.ts",
      prettier: true,
      override: {
        mutator: {
          path: "./src/shared/api/api-instance.ts",
          name: "createInstance",
        },
      },
    },
  },
};
```
$ npm run api:generate
result :
🍻 Start orval v6.31.0 - A swagger client generator for typescript
🎉 main - Your OpenAPI spec has been converted into ready to use orval!
# Error : --> tsconfig.json edit : --> "target": "es5" : --> "target": "es6"

$ npm i -D prettier //config formatter 
.prettierrc {}

$ npm run api:generate

# RESULT : --> src/shared/api/generated.ts
```json problem Enum redeclare .eslintrc.json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@typescript-eslint/no-redeclare": "1"
  }
}
```
$ npm run api:generate













