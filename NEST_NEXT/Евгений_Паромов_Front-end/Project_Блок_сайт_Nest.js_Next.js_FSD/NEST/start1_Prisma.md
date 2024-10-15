# tsconfig.json
```
"strictNullChecks": true
```

# npx prisma init
npx prisma init

# .env
DATABASE_URL=postgres://postgres:Weterr123@localhost/startup2?schema=public


# schema.prisma add
```
model User {
    id    Int    @id @default(autoincrement())
    email String @unique
}
```

# push add to database
npx prisma db push

# generate client
npx prisma generate

# check works PRISMA DATABASE : GET table User
# yarn start:dev
# swagger : Try it out : Execute : Execute : CONSOLE []
# app.controller.ts
```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {ApiOkResponse, ApiProperty} from "@nestjs/swagger";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
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
    const users = await prisma.user.findMany({});
    console.log(users);
    return { message: this.appService.getHello() };
  }
}
```
# FINISH = swagger : Try it out : Execute : Execute : CONSOLE []

# push add to database
npx prisma db push

# generate client
$ npx prisma generate

$ npx prisma migrate

$ npx prisma migrate reset

$ npx prisma migrate dev init
