http://localhost:3000/api/socials

# CREATE API
# pages/api/data
```js
export const socials = [
  {
    id: 1,
    icon: 'youtube',
    path: 'https://youtube.com/YauhenKavalchuk',
  },
  {
    id: 2,
    icon: 'instagram',
    path: 'https://instagram.com/YauhenKavalchuk',
  },
  {
    id: 3,
    icon: 'linkedin',
    path: 'https://linkedin.com/in/YauhenKavalchuk',
  },
  {
    id: 4,
    icon: 'vk',
    path: 'https://vk.com/YauhenKavalchuk',
  },
  {
    id: 5,
    icon: 'twitter',
    path: 'https://twitter.com/YauhenKavalchuk',
  },
];
```

# pages/api/socials
```js
import { socials } from './data/socials';

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(socials);
  };
}
```