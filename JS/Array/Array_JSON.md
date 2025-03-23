```
  // Преобразуем loginHistory из строки в массив, если это необходимо
  if (user.loginHistory && typeof user.loginHistory === 'string') {
    user.loginHistory = JSON.parse(user.loginHistory);
  }
```