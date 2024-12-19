# Input
# https://ui.shadcn.com/docs/components/input


```tsx
{category.map(item => (
    <div key={item.id} className="flex w-full max-w-sm items-center space-x-2 mb-1">
        <Input type='text' value={item.name}/>
        <Button type="submit">Update</Button>
    </div>
))}
```
```tsx
{category.map(item => (
    <div key={item.id} className="flex w-full max-w-sm items-center space-x-2 mb-1">
        <Input type='text' placeholder={item.name}/>
        <Button type="submit">Update</Button>
    </div>
))}
```

```tsx
{
    const [categories, setCategories] = React.useState('');
    
    category.map(item => (
        <div key={item.id} className="flex w-full max-w-sm items-center space-x-2 mb-1">
            <Input type='text' defaultValue={item.name} onChange={e => setCategories(e.target.value)}/>
            <Button type="submit" onClick={() => fLinkVideo(deviceMap.id)}>Update</Button>
        </div>
    ))
}
```
https://react.dev/learn/updating-arrays-in-state
```tsx
export default function List() {
  const [name, setName] = useState('');
  const [artists, setArtists] = useState([]);

    let nextId = 0;
  return (
    <>
      <h1>Inspiring sculptors:</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button onClick={() => {
        artists.push({
          id: nextId++,
          name: name,
        });
      }}>Add</button>
      <ul>
        {artists.map(artist => (
          <li key={artist.id}>{artist.name}</li>
        ))}
      </ul>
    </>
  );
}
```