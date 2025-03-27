```
[Error: EACCES: permission denied, unlink '/home/pi/Projects/docker/docker-ardua/.next/server/app-paths-manifest.json'] {
  errno: -13,
  code: 'EACCES',
  syscall: 'unlink',
  path: '/home/pi/Projects/docker/docker-ardua/.next/server/app-paths-manifest.json'
}
```

sudo chown -R $USER:$USER /home/pi/Projects/docker/docker-ardua
sudo chmod -R 755 /home/pi/Projects/docker/docker-ardua