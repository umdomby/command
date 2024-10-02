https://github.com/EvgenyParomov/block-list.git
https://youtu.be/vrjPzp-bZJo

# nestjs
npm i -g @nestjs/cli

# server
npx nest new server

# swagger
npm i @nestjs/swagger

# add main.ts
const config = new DocumentBuilder().setTitle('Block list').build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
http://localhost:3000/api
http://localhost:3000/api-yaml

# add app.controller.ts
```typescript
import { AppService } from './app.service';
import {ApiOkResponse, ApiProperty} from "@nestjs/swagger";
class HelloWorldDto {
    @ApiProperty()
    message: string;
}
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOkResponse({
        type: HelloWorldDto,
    })
    async getHello(): Promise<HelloWorldDto> {
        return { message: this.appService.getHello() };
    }
}
```