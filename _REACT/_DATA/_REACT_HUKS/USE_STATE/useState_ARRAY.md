```tsx gamerecord_online_old\shared\components\shared\admin-form.tsx
'use client';
import {Category, User} from '@prisma/client';

interface Props {
    data: User;
    category: Category[];
}

export const AdminForm: React.FC<Props> = ({data, category}) => {
    const form = useForm({
        defaultValues: {
            role: data.role,
            category: category,
        },
    });
    const [categories, setCategories] = React.useState<Category[]>(category);

    const eventHandler = (id, value) => {
        setCategories(
            categories.map((item) =>
                item.id === id ? {...item, name: value} : item
            )
        )
    };

    return (
        <Container className="my-10">

            <Title text={`#${data.role}`} size="md" className="font-bold"/>
            <Title text={`Category`} size="md" className="font-bold"/>

            {category.map((item, index) => (
                <div key={index} className="flex w-full max-w-sm items-center space-x-2 mb-1">
                    <Input type='text'
                           defaultValue={item.name}
                           onChange={e => eventHandler(item.id, e.target.value)
                           }/>
                    <Button type="submit"
                            disabled={item.name === categories[index].name}
                            onClick={() => eventHandler(item.id)}>Update
                    </Button>
                </div>
            ))}

        </Container>
    );
};
```


```tsx https://ru.stackoverflow.com/questions/1237696/Как-правильно-передать-массив-в-хук-usestate-react-js
import React, { useState } from "react";

const App = () => {
  const initialState = [
    { id: 1, title: "Title1", text: "Text1", likes: 0 },
    { id: 2, title: "Title2", text: "Text2", likes: 1 },
    { id: 3, title: "Title3", text: "Text3", likes: 2 },
  ];

  const [posts, setPosts] = useState(initialState);

  const likeHandler = (id) => {
    setPosts(
      posts.map((item) =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      )
    );
  };

  const deleteHandler = (id) => {
    setPosts(posts.filter((item) => item.id !== id));
  };

  return (
    <div>
      Posts:
      {posts.map(({ id, title, text, likes }) => (
        <div key={id}>
          <h1>{title}</h1>
          <h3>{text}</h3>
          <button onClick={() => likeHandler(id)}>Likes: {likes}</button>
          <button onClick={() => deleteHandler(id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default App;
```