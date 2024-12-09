# components/Navbar.js

```js
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Navbar.module.scss";

const navigation = [
    { id: 1, title: 'Home', path: '/' },
    { id: 2, title: 'Posts', path: '/posts' },
    { id: 3, title: 'Contacts', path: '/contacts' },
];

const Navbar = () => {
    const { pathname } = useRouter();

    return (
        <nav className={styles.nav}>
            <div className={styles.logo}>
                webDev
            </div>
            <div className={styles.links}>
                {navigation.map(({ id, title, path }) => (
                    <Link key={id} href={path} className={pathname === path ? styles.active : null}>
                        {title}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
```

# component/Header.js
```js
import Navbar from "./Navbar";

const Header = () => (
  <header>
      <Navbar />
  </header>
);

export default Header;
```

# Invalid `<Link>` with `<a>` child
Why This Error Occurred
Starting with Next.js 13, <Link> renders as <a>, so attempting to use <a> as a child is invalid.

Possible Ways to Fix It
Run the new-link codemod to automatically upgrade previous versions of Next.js to the new <Link> usage:

Terminal

$ npx @next/codemod new-link .
```js
//This will change
<Link><a id="link">Home</a></Link> 
// to 
<Link id="link">Home</Link>
//Alternatively, you can add the legacyBehavior prop 
<Link legacyBehavior><a id="link">Home</a></Link>
```

# 404 redirect
```js
import { useEffect } from "react";
import { useRouter } from "next/router";
import Heading from "../components/Heading";
import styles from "../styles/404.module.scss";

const Error = () => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push('/');
    }, 3000);
  }, [router]);

  return (
    <div className={styles.wrapper}>
      <div>
        <Heading text="404" />
        <Heading tag="h2" text="Something is going wrong..." />
      </div>
    </div>
  )
};

export default Error;
```
