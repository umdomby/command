npm i sass

# pages/_app.js
```js
import '../styles/globals.scss';
```

# styles/Home.module.scss
```scss
.wrapper {
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

```
# pages index.js
```js
import Heading from "../components/Heading";
import styles from '../styles/Home.module.scss';

const Home = () => (
  <div className={styles.wrapper}>
    <Heading text="Next.js Application" />
  </div>
);

export default Home;
```




