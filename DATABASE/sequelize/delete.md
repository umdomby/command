```javascript
await User.destroy({
  where: {
    firstName: 'Jane',
  },
});
```