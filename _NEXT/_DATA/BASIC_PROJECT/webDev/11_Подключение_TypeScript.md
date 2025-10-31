$ yarn add --dev typescrypt @types/react
```json
{
    "devDependencies": {
    "@types/react": "^17--.0.16",
    "eslint": "7-.31.0",
    "eslint-config-next": "11.0.1",
    "typescript": "^4-All.3.5"
    }
}
```

# types.ms
```typescript
export type addressType = {
  street: string,
  suite: string,
  city: string,
  zipcode: string,
};

export type contactType = {
  id: string,
  name: string,
  email: string,
  address: addressType,
};

export type postType = {
  title: string,
  body: string,
}
```

# components/ContactInfo.tsx
```tsx
import { FC } from "react";
import Heading from "./Heading";
import { contactType } from "../types";

type contactInfoProps = {
  contact: contactType,
}

const ContactInfo:FC<contactInfoProps> = ({ contact }) => {
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


# pages/contacts/[id].tsx
```tsx
import { GetServerSideProps } from "next";
 // export const getServerSideProps:GetServerSideProps
```


# pages/contacts/index.tsx
```tsx
import { GetStaticProps } from "next";
// export const getStaticProps:GetStaticProps
```




```tsx
import { NextApiRequest, NextApiResponse } from 'next';
import { socials } from './data/socials';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(socials);
  };
}
```
