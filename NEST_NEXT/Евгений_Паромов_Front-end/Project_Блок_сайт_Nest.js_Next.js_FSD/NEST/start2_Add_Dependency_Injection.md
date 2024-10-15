# ADD Dependency injection

# Add new Service
npx nest g mo db
npx nest g s db

# db.module.ts
```typescript
import { Module } from '@nestjs/common';
import { DbService } from './db.service';
@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
```
# db.service.ts
```typescript
import {Injectable, OnModuleInit} from '@nestjs/common';
import {PrismaClient} from "@prisma/client";
@Injectable()
export class DbService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
    }
}
```

# app.controller.ts
```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { DbService } from './db/db.service';
class HelloWorldDto {
  @ApiProperty()
  message: string;
}
@Controller()
export class AppController {
  constructor(
      private readonly appService: AppService,
      private dbService: DbService,
  ) {}

  @Get()
  @ApiOkResponse({
    type: HelloWorldDto,
  })
  async getHello(): Promise<HelloWorldDto> {
    const users = await this.dbService.user.findMany({});
    console.log(users);
    return { message: this.appService.getHello() };
  }
}
```
# Finish = db.service.ts ```await this.$connect();``` hook connect DataBase
