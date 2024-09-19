https://youtu.be/BVEm3IjrgGI

http://localhost:5003/graphql

http://localhost:5003/graphql?query
```
query{
  getAllUsers {
    id,username, age, posts {
        id, title
    }
  }
}
```
```
mutation {
  createUser(input: {
    username: "Nasya"
    age: 35
  }){
    id, username, age
  }
}
```

```
mutation {
  createUser(input: {
    username: "Nasyaa"
    age: 353
    posts: [
      {id:1, title2:"javasript2", content:"top2"}
    ]
  }){
    id, username, age
  }
}
```
