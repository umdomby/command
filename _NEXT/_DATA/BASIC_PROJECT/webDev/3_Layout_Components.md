```js
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

export default Layout;
```

```js
import Layout from "../components/Layout";
import '../styles/globals.css';

const MyApp = ({ Component, pageProps }) => (
    <Layout>
        <main>
            <Component {...pageProps} />
        </main>
    </Layout>
);

export default MyApp;
```

```js
import Heading from "./Heading";
const Header = () => (
  <header>
    <Heading tag="h3" text="Header" />
  </header>
);
export default Header;


import Heading from "./Heading";
const Footer = () => (
    <footer>
        <Heading tag="h3" text="Created by webDev" />
    </footer>
);
export default Footer;
```

# pages/404.js
```js
import Heading from "../components/Heading";

const Error = () => (
  <>
    <Heading text="404" />
    <Heading tag="h2" text="Something is going wrong..." />
  </>
);

export default Error;
```