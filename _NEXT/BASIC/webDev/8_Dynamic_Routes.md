# [id].js

# pages/contact/[id].js
```js
import Head from "next/head";
import ContactInfo from "../../components/ContactInfo";

const Contact = ({ contact }) => (
    <>
        <Head>
            <title>Contact</title>
        </Head>
        <ContactInfo contact={contact} />
    </>
);

export default Contact;
```

# components/ContactInfo.js
```js
import Heading from "./Heading";

const ContactInfo = ({ contact }) => {
    const { name, email, address } = contact || {};
    const { street, suite, city, zipcode } = address || {};

    if (!contact) {
        return <Heading tag="h3" text="Empty contact" />
    }

    return (
        <>
            <Heading tag="h3" text={name} />
            <div>
                <strong>Email: </strong>
                {email}
            </div>
            <div>
                <strong>Address: </strong>
                {`${street}, ${suite}, ${city}, ${zipcode}`}
            </div>
        </>
    );
}

export default ContactInfo;
```

# pages/contacts/index.js
```js
import Head from "next/head";
import Link from "next/link";
import Heading from "../../components/Heading";

export const getStaticProps = async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const data = await response.json();

    if (!data) {
        return {
            notFound: true,
        }
    }

    return {
        props: { contacts: data },
    }
};

const Contacts = ({ contacts }) => {
    return (
        <>
            <Head>
                <title>Contacts</title>
            </Head>
            <Heading text="Contacts list:" />
            <ul>
                {contacts && contacts.map(({ id, name }) => (
                    <li key={id}>
                        <Link href={`/contacts/${id}`}>{name}</Link>
                    </li>
                ))}
            </ul>
        </>
    );
};

export default Contacts;
```
