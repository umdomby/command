```js
  return (
    <div>
      {(() => {
        if (someCase) {
          return (
            <div>someCase</div>
          )
        } else if (otherCase) {
          return (
            <div>otherCase</div>
          )
        } else {
          return (
            <div>catch all</div>
          )
        }
      })()}
    </div>
  )
```

```js
 return (
    <div>
      {isLoggedIn ? (
        <LogoutButton onClick={this.handleLogoutClick} />
      ) : (
        <LoginButton onClick={this.handleLoginClick} />
      )}
    </div>
  );
```

```js
if (isLoggedIn) {
  button = <LogoutButton onClick={this.handleLogoutClick} />;
} else {
  button = <LoginButton onClick={this.handleLoginClick} />;
}

return (
  <div>
    <Greeting isLoggedIn={isLoggedIn} />
    {button}
  </div>
);
```

```js
  return (
    <div>
      <h1>Hello!</h1>
      {unreadMessages.length > 0 &&
        <h2>
          You have {unreadMessages.length} unread messages.
        </h2>
      }
    </div>
  );
```