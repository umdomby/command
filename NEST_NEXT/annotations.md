```typescript
@Injectable() // позволяет вам внедрять экземпляры.

@ApiCreatedResponse //
@ApiProperty // swagger
@ApiProperty({ required: false }) // обязательная опция в swagger
@ApiOkResponse // описание возвращаемого знаения.


@IsIn // валидация
@IsOptional // Проверяет, является ли заданное значение пустым ( === null, === undefined), и если да, игнорирует все валидаторы для свойства.


@UseGuards(AuthGuard) // доступна сессия
@SessionInfo() session: GetSessionInfoDto


@Query() query: BlockListQueryDto

```




