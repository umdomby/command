http://localhost:7000/api/docs

# /auth/registration

```json
{
"email": "1@1.com",
"password": "123123"
}
```

# /roles
```json
{
    "value":"ADMIN",
    "description":"Администратор"
}
```

# /users/role
```json
{
  "roleId": 1,
  "userId": 3
}
```

# POST raw JSON
http://localhost:5000/users
```json
{
    "email":"2@2.com",
    "password": "123123"
}
```

# POST raw JSON
http://localhost:5000/auth/registration
```json
{
    "email":"22@22.com",
    "password": "123123"
}
```
