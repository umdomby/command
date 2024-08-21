npm i -g @nestjs/cli
nest new myback

# main.ts
```js
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
async function start() {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule)
    await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`))
}

start()
```

# app.module.ts
```js
import {Module} from "@nestjs/common";

@Module({})
export class AppModule {}
```
# yarn start:dev

# app.controller.ts
```js
import {Controller, Get} from "@nestjs/common";

@Controller('/api')
    export class AppController {
    @Get('/users')
    getUsers(){
        return [{id: 1, name: 'My Project Nest JS'}]
    }
}
```
# http://localhost:5000/api/users
# result [{"id":1,"name":"My Project Nest JS"}]



