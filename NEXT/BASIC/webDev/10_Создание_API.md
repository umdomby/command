http://localhost:3000/api/socials

# CREATE API
# pages/api/data/social.js
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

# pages/api/socials.js
```js
import { socials } from './data/socials';

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(socials);
  };
}
```

# RENDERING
# component/Socials.js
```js
import Head from "next/head";
import styles from "../styles/Socials.module.scss";

const Socials = ({ socials }) => {

  if (!socials) {
    return null;
  }

  return (
    <>
    <Head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.0/css/all.css" />
    </Head>
    <ul className={styles.socials}>
      {socials && socials.map(({ id, icon, path }) => (
        <li key={id}>
          <a href={path} target="_blank" rel="noopener noreferrer">
            <i className={`fab fa-${icon}`} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
    </>
  );
}

export default Socials;
```

# pages/index.js
```js
import Head from "next/head";
import Heading from "../components/Heading";
import Socials from "../components/Socials";
import styles from "../styles/Home.module.scss";

export const getStaticProps = async () => {
    const response = await fetch(`${process.env.API_HOST}/socials`);
    const data = await response.json();

    if (!data) {
        return {
            notFound: true,
        }
    }

    return {
        props: { socials: data },
    }
};

const Home = ({ socials }) => (
    <div className={styles.wrapper}>
        <Head>
            <title>Home</title>
        </Head>
        <Heading text="Next.js Application" />
        <Socials socials={socials} />
    </div>
);

export default Home;
```
