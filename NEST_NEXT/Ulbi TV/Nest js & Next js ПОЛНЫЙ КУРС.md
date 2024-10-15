# Nest js & Next js ПОЛНЫЙ КУРС. FullStack разработка SSR на React TypeScript. Музыкальная платформа
https://youtu.be/A0CfYSVzAZI
$ npx nest g co ulbi --no-spec
```typescript
@Controller('ulbi')
export class UlbiController {
    @Get()
    getUsers(){
        return 'GET ALL USERS'
    }
}
```
$ npx nest g mo ulbi --no-spec
```typescript
@Module({
    controllers: [UlbiController],
})
```
```typescript add UlbiModule in app.modules.ts
@Module({
    imports: [UlbiModule],
    controllers: [AppController, UlbiController],
    providers: [AppService],
})
export class AppModule {}
```
# result 
http://localhost:3000/ulbi
GET ALL USERS


####################################  ADD SERVICE ####################################
# ADD SERVICE
# ulbi.service.ts
```typescript
@Injectable()
export class UlbiService {
    getUsers(): string {
        return 'GET ALL USERS SERVICE'
    }
}
```
```typescript
@Controller('ulbi')
export class UlbiController {
    constructor(private ulbiService: UlbiService) {}
    @Get()
    getUsers(){
        return this.ulbiService.getUsers()
    }
}
```

# ###############################
$ npx nest g s ulbi --no-spec
# ? npx nest g gu auth --no-spec --flat

