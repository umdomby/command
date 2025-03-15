https://www.youtube.com/watch?v=8OHe6chCWTE

```
const privateKey = fs.readFileSync(path.resolve('/etc/letsencrypt/live/serbot.online/privkey.pem'));
const certificate = fs.readFileSync(path.resolve('/etc/letsencrypt/live/serbot.online/cert.pem'));
const ca = fs.readFileSync(path.resolve('/etc/letsencrypt/live/serbot.online/chain.pem'));
```