# Font
# _app.js
```js
import Head from "next/head";

const MyApp = ({ Component, pageProps }) => (
        <Head>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300&display=swap" rel="stylesheet" />
        </Head>
);

export default MyApp;
```

# Images
```js
import Image from "next/image";
<div className={styles.logo}>
    <Image src="/logo.png" width={60} height={60} alt="webDev" />
</div>
```

# Metadata
```js
import Head from "next/head";

const Posts = () => (
  <>
      <Head>
          <title>Posts</title>
      </Head>
  </>
);

export default Posts;
```
