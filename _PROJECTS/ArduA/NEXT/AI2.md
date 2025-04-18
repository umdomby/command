\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\app
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\stores
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\stores\motorControlStore.ts



// file: docker-ardua/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/components/constants/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


// file: docker-ardua/app/api/users/route.ts
import { prisma } from '@/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
const users = await prisma.user.findMany();
return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
const data = await req.json();
const user = await prisma.user.create({
data,
});

return NextResponse.json(user);
}


// file: docker-ardua/app/(root)/profile/page.tsx
// app/(root)/profile/index.tsx
import { prisma } from '@/prisma/prisma-client';
import { ProfileForm } from '@/components/profile-form';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // <-- Добавьте эту строку

export default async function ProfilePage() {
const session = await getUserSession();

if (!session) {
return redirect('/');
}

const user = await prisma.user.findFirst({ where: { id: Number(session?.id) } });

if (!user) {
return redirect('/');
}

return <ProfileForm data={user} />;
}

// file: docker-ardua/app/(root)/page.tsx
"use server"
import { Container } from '@/components/container';
import { HEROES_CLIENT } from '@/components/HEROES_CLIENT';
import { getUserSession } from '@/components/lib/get-user-session';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import Loading from "@/app/(root)/loading";
import {prisma} from "@/prisma/prisma-client";
import SocketClient from "@/components/control/SocketClient";
import WebRTC from  "@/components/webrtc";

export default async function Home() {
const session = await getUserSession();

    if (!session?.id) {
        return (
            <Container className="flex flex-col my-10">
                <Suspense fallback={<Loading />}>
                    123
                </Suspense>
            </Container>
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            id: Number(session.id)
        }
    });

    if (!user) {
        return (
            <Container className="flex flex-col my-10">
                <Suspense fallback={<Loading />}>
                    123
                </Suspense>
            </Container>
        );
    }

    return (
        // <Container className="flex flex-col my-10">
            <Suspense fallback={<Loading />}>
                {/*<SocketClient/>*/}
                <WebRTC/>
            </Suspense>
        // </Container>
    );
}

// file: docker-ardua/app/(root)/layout.tsx
import { Header } from '@/components/header';
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
title: 'HEROES 3',
};

export const dynamic = 'force-dynamic'; // Отключаем SSG


export default function HomeLayout({ children }: { children: React.ReactNode }) {
return (
<main className="min-h-screen">
<Suspense>
<Header />
</Suspense>
{children}
</main>
);
}

// file: docker-ardua/app/(root)/loading.tsx
export default function Loading(){
return <div style={{width: "50%", margin: "0 auto"}}> Loading...</div>
}

// file: docker-ardua/app/actions.ts
'use server';
import {prisma} from '@/prisma/prisma-client';
import {getUserSession} from '@/components/lib/get-user-session';
import {Prisma} from '@prisma/client';
import {hashSync} from 'bcrypt';
import * as z from 'zod'
import { revalidatePath } from 'next/cache';
import { BetParticipant, PlayerChoice } from '@prisma/client'


export async function updateUserInfo(body: Prisma.UserUpdateInput) {
try {
const currentUser = await getUserSession();

    if (!currentUser) {
      throw new Error('Пользователь не найден');
    }

    const findUser = await prisma.user.findFirst({
      where: {
        id: Number(currentUser.id),
      },
    });

    await prisma.user.update({
      where: {
        id: Number(currentUser.id),
      },
      data: {
        fullName: body.fullName,
        email: body.email,
        password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
      },
    });
} catch (err) {
throw err;
}
}
export async function registerUser(body: Prisma.UserCreateInput) {
try {
const user = await prisma.user.findFirst({
where: {
email: body.email,
},
});
if (user) {
throw new Error('Пользователь уже существует');
}
await prisma.user.create({
data: {
fullName: body.fullName,
email: body.email,
password: hashSync(body.password, 10),
},
});
} catch (err) {
console.log('Error [CREATE_USER]', err);
throw err;
}
}


// file: docker-ardua/app/layout.tsx
'use server'
import { Nunito } from 'next/font/google';
import './globals.css';
import {Providers} from "@/components/providers";


const nunito = Nunito({
subsets: ['cyrillic'],
variable: '--font-nunito',
weight: ['400', '500', '600', '700', '800', '900'],
});

export default async function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {

    return (
        <html lang="en">
        <head>
            {/*<link data-rh="true" rel="icon" href="/logo.webp" />*/}
        </head>
        <body className={nunito.className} suppressHydrationWarning={true}>
        <Providers>
            <main>{children}</main>
        </Providers>
        </body>
        </html>
    );
}

// file: docker-ardua/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
scroll-behavior: smooth;
}

@media screen and (prefers-reduced-motion: reduce) {
html {
scroll-behavior: auto;
}
}

@layer base {
:root {
--foreground: 20 14.3% 4.1%;

    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;

    --popover: 0 0% 100%;
    --popover-foreground: 20 14.3% 4.1%;

    --primary: 22 100% 50%;
    --primary-foreground: 60 9.1% 97.8%;

    --secondary: 32 100% 98%;
    --secondary-foreground: 24 9.8% 10%;

    --muted: 60 4.8% 95.9%;
    --muted-foreground: 25 5.3% 44.7%;

    --accent: 60 4.8% 95.9%;
    --accent-foreground: 24 9.8% 10%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 60 9.1% 97.8%;

    --border: 20 5.9% 90%;
    --input: 0 0% 90%;
    --ring: 24.6 95% 53.1%;
    --radius: 18px;
}
}
.dark {
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;

--card: 222.2 84% 4.9%;
--card-foreground: 210 40% 98%;

--popover: 222.2 84% 4.9%;
--popover-foreground: 210 40% 98%;

--primary: 210 40% 98%;
--primary-foreground: 222.2 47.4% 11.2%;

--secondary: 217.2 32.6% 17.5%;
--secondary-foreground: 210 40% 98%;

--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;

--accent: 217.2 32.6% 17.5%;
--accent-foreground: 210 40% 98%;

--destructive: 0 62.8% 30.6%;
--destructive-foreground: 210 40% 98%;

--border: 217.2 32.6% 17.5%;
--input: 217.2 32.6% 17.5%;
--ring: 212.7 26.8% 83.9%;
}

* {
  font-family: var(--font-nunito), sans-serif;
  }

.scrollbar::-webkit-scrollbar {
width: 4px;
}

.scrollbar::-webkit-scrollbar-track {
border-radius: 6px;
background: #fff;
}

.scrollbar::-webkit-scrollbar-thumb {
background: #dbdadd;
border-radius: 6px;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
background: #dbdadd;
}

@layer utilities {
.text-balance {
text-wrap: balance;
}
}

@layer base {
* {
  @apply border-border;
  }
  body {
  @apply bg-background text-foreground;
  }
  }

#nprogress .bar {
@apply bg-primary !important;
}

#nprogress .peg {
@apply shadow-md shadow-primary !important;
}

#nprogress .spinner-icon {
@apply border-t-primary border-l-primary !important;
}
.p-4 {
padding: 0.3rem;
}

.table-cell-text {
white-space: nowrap; /* Запрет на перенос текста */
overflow: hidden; /* Обрезать текст за пределами блока */
text-overflow: ellipsis; /* Добавлять троеточие вместо обрезанного текста */
width: 100%; /* Фиксированная ширина */
}

.font-medium {
font-weight: 0;
}
.p-4 {
padding: .2rem;
}

/*.dialog-content {*/
/*  width: 95vw; !* Полная ширина экрана *!*/
/*  height: 90vh; !* Полная высота экрана *!*/
/*  padding: 0; !* Убираем отступы *!*/
/*  background: rgba(0, 0, 0, 0.8); !* Полупрозрачный фон для затемнения *!*/
/*}*/

.image-container {
position: relative; /* Для использования layout="fill" */
width: 100%;
height: 100%;
}

.image-container img {
object-fit: contain; /* Или cover, в зависимости от ваших предпочтений */
}

.image-container { /*  Класс для контейнера изображения */
width: 50%; /* Или любое другое значение */
height: auto; /*  Сохраняем соотношение сторон */
}

// file: docker-ardua/components/ui/form.tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
Controller,
ControllerProps,
FieldPath,
FieldValues,
FormProvider,
useFormContext,
} from "react-hook-form"

import { cn } from "@/components/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
TFieldValues extends FieldValues = FieldValues,
TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
{} as FormFieldContextValue
)

const FormField = <
TFieldValues extends FieldValues = FieldValues,
TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
...props
}: ControllerProps<TFieldValues, TName>) => {
return (
<FormFieldContext.Provider value={{ name: props.name }}>
<Controller {...props} />
</FormFieldContext.Provider>
)
}

const useFormField = () => {
const fieldContext = React.useContext(FormFieldContext)
const itemContext = React.useContext(FormItemContext)
const { getFieldState, formState } = useFormContext()

const fieldState = getFieldState(fieldContext.name, formState)

if (!fieldContext) {
throw new Error("useFormField should be used within <FormField>")
}

const { id } = itemContext

return {
id,
name: fieldContext.name,
formItemId: `${id}-form-item`,
formDescriptionId: `${id}-form-item-description`,
formMessageId: `${id}-form-item-message`,
...fieldState,
}
}

type FormItemContextValue = {
id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
{} as FormItemContextValue
)

const FormItem = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
const id = React.useId()

return (
<FormItemContext.Provider value={{ id }}>
<div ref={ref} className={cn("space-y-2", className)} {...props} />
</FormItemContext.Provider>
)
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
React.ElementRef<typeof LabelPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
const { error, formItemId } = useFormField()

return (
<Label
ref={ref}
className={cn(error && "text-destructive", className)}
htmlFor={formItemId}
{...props}
/>
)
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
React.ElementRef<typeof Slot>,
React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

return (
<Slot
ref={ref}
id={formItemId}
aria-describedby={
!error
? `${formDescriptionId}`
: `${formDescriptionId} ${formMessageId}`
}
aria-invalid={!!error}
{...props}
/>
)
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
const { formDescriptionId } = useFormField()

return (
<p
ref={ref}
id={formDescriptionId}
className={cn("text-sm text-muted-foreground", className)}
{...props}
/>
)
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
HTMLParagraphElement,
React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
const { error, formMessageId } = useFormField()
const body = error ? String(error?.message) : children

if (!body) {
return null
}

return (
<p
ref={ref}
id={formMessageId}
className={cn("text-sm font-medium text-destructive", className)}
{...props}
>
{body}
</p>
)
})
FormMessage.displayName = "FormMessage"

export {
useFormField,
Form,
FormItem,
FormLabel,
FormControl,
FormDescription,
FormMessage,
FormField,
}


// file: docker-ardua/components/ui/index.ts
export { Button } from './button';
export { Checkbox } from './checkbox';
export { Dialog } from './dialog';
export { Drawer } from './drawer';
export { Input } from './input';
export { Popover } from './popover';
export { Select } from './select';
export { Skeleton } from './skeleton';
export { Slider } from './slider';
export { Textarea } from './textarea';
export { Label } from './label';
export { Form } from './form';


// file: docker-ardua/components/ui/tabs.tsx
// components/ui/tabs.tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/components/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
React.ElementRef<typeof TabsPrimitive.List>,
React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
<TabsPrimitive.List
ref={ref}
className={cn(
"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
className
)}
{...props}
/>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
React.ElementRef<typeof TabsPrimitive.Trigger>,
React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
<TabsPrimitive.Trigger
ref={ref}
className={cn(
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
className
)}
{...props}
/>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
React.ElementRef<typeof TabsPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
<TabsPrimitive.Content
ref={ref}
className={cn(
"mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
className
)}
{...props}
/>
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

// file: docker-ardua/components/ui/input.tsx
import * as React from 'react';

import { cn } from '@/components/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
({ className, type, ...props }, ref) => {
return (
<input
type={type}
className={cn(
'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
className,
)}
ref={ref}
{...props}
/>
);
},
);
Input.displayName = 'Input';

export { Input };


// file: docker-ardua/components/ui/label.tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/components/lib/utils"

const labelVariants = cva(
"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
React.ElementRef<typeof LabelPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
<LabelPrimitive.Root
ref={ref}
className={cn(labelVariants(), className)}
{...props}
/>
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }


// file: docker-ardua/components/ui/sheet.tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/components/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Overlay>,
React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
<SheetPrimitive.Overlay
className={cn(
"fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
className
)}
{...props}
ref={ref}
/>
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
"fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
{
variants: {
side: {
top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
bottom:
"inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
right:
"inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
},
},
defaultVariants: {
side: "right",
},
}
)

interface SheetContentProps
extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Content>,
SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
<SheetPortal>
<SheetOverlay />
<SheetPrimitive.Content
ref={ref}
className={cn(sheetVariants({ side }), className)}
{...props}
>
{children}
<SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
<X className="h-4 w-4" />
<span className="sr-only">Close</span>
</SheetPrimitive.Close>
</SheetPrimitive.Content>
</SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
className,
...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
className,
...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Title>,
React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
<SheetPrimitive.Title
ref={ref}
className={cn("text-lg font-semibold text-foreground", className)}
{...props}
/>
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
React.ElementRef<typeof SheetPrimitive.Description>,
React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
<SheetPrimitive.Description
ref={ref}
className={cn("text-sm text-muted-foreground", className)}
{...props}
/>
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
Sheet,
SheetPortal,
SheetOverlay,
SheetTrigger,
SheetClose,
SheetContent,
SheetHeader,
SheetFooter,
SheetTitle,
SheetDescription,
}


// file: docker-ardua/components/ui/table.tsx
import * as React from "react"

import { cn } from "@/components/lib/utils"

const Table = React.forwardRef<
HTMLTableElement,
React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
HTMLTableSectionElement,
React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
HTMLTableSectionElement,
React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
HTMLTableSectionElement,
React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
HTMLTableRowElement,
React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
HTMLTableCellElement,
React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
HTMLTableCellElement,
React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
HTMLTableCaptionElement,
React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
Table,
TableHeader,
TableBody,
TableFooter,
TableHead,
TableRow,
TableCell,
TableCaption,
}


// file: docker-ardua/components/ui/button.tsx
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/lib/utils';
import { Loader } from 'lucide-react';

const buttonVariants = cva(
'inline-flex items-center justify-center whitespace-nowrap rounded-md active:translate-y-[1px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-gray-500',
{
variants: {
variant: {
default: 'bg-primary text-primary-foreground hover:bg-primary/90',
destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
outline: 'border border-primary text-primary bg-transparent hover:bg-secondary',
secondary: 'bg-secondary text-primary hover:bg-secondary/50',
ghost: 'hover:bg-secondary hover:text-secondary-foreground',
link: 'text-primary underline-offset-4 hover:underline',
},
size: {
default: 'h-10 px-4 py-2',
sm: 'h-9 rounded-md px-3',
lg: 'h-11 rounded-md px-8',
icon: 'h-10 w-10',
},
},
defaultVariants: {
variant: 'default',
size: 'default',
},
},
);

export interface ButtonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement>,
VariantProps<typeof buttonVariants> {
asChild?: boolean;
loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
({ className, variant, size, asChild = false, children, disabled, loading, ...props }, ref) => {
const Comp = asChild ? Slot : 'button';
return (
<Comp
disabled={disabled || loading}
className={cn(buttonVariants({ variant, size, className }))}
ref={ref}
{...props}>
{!loading ? children : <Loader className="w-5 h-5 animate-spin" />}
</Comp>
);
},
);
Button.displayName = 'Button';

export { Button, buttonVariants };


// file: docker-ardua/components/ui/dialog.tsx
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/components/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Overlay>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
<DialogPrimitive.Overlay
ref={ref}
className={cn(
'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
className,
)}
{...props}
/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
<DialogPortal>
<DialogOverlay />
<DialogPrimitive.Content
ref={ref}
className={cn(
'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
className,
)}
{...props}>
{children}
<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
<X className="h-4 w-4" />
<span className="sr-only">Close</span>
</DialogPrimitive.Close>
</DialogPrimitive.Content>
</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Title>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
<DialogPrimitive.Title
ref={ref}
className={cn('text-lg font-semibold leading-none tracking-tight', className)}
{...props}
/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
React.ElementRef<typeof DialogPrimitive.Description>,
React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
<DialogPrimitive.Description
ref={ref}
className={cn('text-sm text-muted-foreground', className)}
{...props}
/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
Dialog,
DialogPortal,
DialogOverlay,
DialogClose,
DialogTrigger,
DialogContent,
DialogHeader,
DialogFooter,
DialogTitle,
DialogDescription,
};


// file: docker-ardua/components/ui/drawer.tsx
'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/components/lib/utils';

const Drawer = ({
shouldScaleBackground = true,
...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
<DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Overlay>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
<DrawerPrimitive.Overlay
ref={ref}
className={cn('fixed inset-0 z-50 bg-black/80', className)}
{...props}
/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
<DrawerPortal>
<DrawerOverlay />
<DrawerPrimitive.Content
ref={ref}
className={cn(
'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
className,
)}
{...props}>
<div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
{children}
</DrawerPrimitive.Content>
</DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Title>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
<DrawerPrimitive.Title
ref={ref}
className={cn('text-lg font-semibold leading-none tracking-tight', className)}
{...props}
/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
React.ElementRef<typeof DrawerPrimitive.Description>,
React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
<DrawerPrimitive.Description
ref={ref}
className={cn('text-sm text-muted-foreground', className)}
{...props}
/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
Drawer,
DrawerPortal,
DrawerOverlay,
DrawerTrigger,
DrawerClose,
DrawerContent,
DrawerHeader,
DrawerFooter,
DrawerTitle,
DrawerDescription,
};


// file: docker-ardua/components/ui/select.tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/components/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Trigger>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
<SelectPrimitive.Trigger
ref={ref}
className={cn(
'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
className,
)}
{...props}>
{children}
<SelectPrimitive.Icon asChild>
<ChevronDown className="h-4 w-4 opacity-50" />
</SelectPrimitive.Icon>
</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
<SelectPrimitive.ScrollUpButton
ref={ref}
className={cn('flex cursor-default items-center justify-center py-1', className)}
{...props}>
<ChevronUp className="h-4 w-4" />
</SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
<SelectPrimitive.ScrollDownButton
ref={ref}
className={cn('flex cursor-default items-center justify-center py-1', className)}
{...props}>
<ChevronDown className="h-4 w-4" />
</SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
<SelectPrimitive.Portal>
<SelectPrimitive.Content
ref={ref}
className={cn(
'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
position === 'popper' &&
'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
className,
)}
position={position}
{...props}>
<SelectScrollUpButton />
<SelectPrimitive.Viewport
className={cn(
'p-1',
position === 'popper' &&
'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
)}>
{children}
</SelectPrimitive.Viewport>
<SelectScrollDownButton />
</SelectPrimitive.Content>
</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Label>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
<SelectPrimitive.Label
ref={ref}
className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
{...props}
/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Item>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
<SelectPrimitive.Item
ref={ref}
className={cn(
'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
className,
)}
{...props}>
<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
<SelectPrimitive.ItemIndicator>
<Check className="h-4 w-4" />
</SelectPrimitive.ItemIndicator>
</span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
React.ElementRef<typeof SelectPrimitive.Separator>,
React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
<SelectPrimitive.Separator
ref={ref}
className={cn('-mx-1 my-1 h-px bg-muted', className)}
{...props}
/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
Select,
SelectGroup,
SelectValue,
SelectTrigger,
SelectContent,
SelectLabel,
SelectItem,
SelectSeparator,
SelectScrollUpButton,
SelectScrollDownButton,
};


// file: docker-ardua/components/ui/slider.tsx
'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/components/lib/utils';

const Slider = React.forwardRef<
React.ElementRef<typeof SliderPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
<SliderPrimitive.Root
ref={ref}
className={cn('relative flex w-full touch-none select-none items-center', className)}
{...props}>
<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
<SliderPrimitive.Range className="absolute h-full bg-primary" />
</SliderPrimitive.Track>
<SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };


// file: docker-ardua/components/ui/popover.tsx
'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/components/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
React.ElementRef<typeof PopoverPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
<PopoverPrimitive.Portal>
<PopoverPrimitive.Content
ref={ref}
align={align}
sideOffset={sideOffset}
className={cn(
'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
className,
)}
{...props}
/>
</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };


// file: docker-ardua/components/ui/checkbox.tsx
'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/components/lib/utils';

const Checkbox = React.forwardRef<
React.ElementRef<typeof CheckboxPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
<CheckboxPrimitive.Root
ref={ref}
className={cn(
'peer h-4 w-4 shrink-0 bg-gray-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
className,
)}
{...props}>
<CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
<Check className="h-4 w-4" strokeWidth={3} />
</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };


// file: docker-ardua/components/ui/skeleton.tsx
import { cn } from '@/components/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };


// file: docker-ardua/components/ui/textarea.tsx
import * as React from "react"

import { cn } from "@/components/lib/utils"

export interface TextareaProps
extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
({ className, ...props }, ref) => {
return (
<textarea
className={cn(
"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
className
)}
ref={ref}
{...props}
/>
)
}
)
Textarea.displayName = "Textarea"

export { Textarea }


// file: docker-ardua/components/ui/dropdown-menu.tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/components/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
inset?: boolean
}
>(({ className, inset, children, ...props }, ref) => (
<DropdownMenuPrimitive.SubTrigger
ref={ref}
className={cn(
"flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
inset && "pl-8",
className
)}
{...props}
>
    {children}
    <ChevronRight className="ml-auto" />
</DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
<DropdownMenuPrimitive.SubContent
ref={ref}
className={cn(
"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
className
)}
{...props}
/>
))
DropdownMenuSubContent.displayName =
DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.Content>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
<DropdownMenuPrimitive.Portal>
<DropdownMenuPrimitive.Content
ref={ref}
sideOffset={sideOffset}
className={cn(
"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
className
)}
{...props}
/>
</DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.Item>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
inset?: boolean
}
>(({ className, inset, ...props }, ref) => (
<DropdownMenuPrimitive.Item
ref={ref}
className={cn(
"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
inset && "pl-8",
className
)}
{...props}
/>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
<DropdownMenuPrimitive.CheckboxItem
ref={ref}
className={cn(
"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
className
)}
checked={checked}
{...props}
>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
</DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
<DropdownMenuPrimitive.RadioItem
ref={ref}
className={cn(
"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
className
)}
{...props}
>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
</DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.Label>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
inset?: boolean
}
>(({ className, inset, ...props }, ref) => (
<DropdownMenuPrimitive.Label
ref={ref}
className={cn(
"px-2 py-1.5 text-sm font-semibold",
inset && "pl-8",
className
)}
{...props}
/>
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
<DropdownMenuPrimitive.Separator
ref={ref}
className={cn("-mx-1 my-1 h-px bg-muted", className)}
{...props}
/>
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
className,
...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
return (
<span
className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
{...props}
/>
)
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
DropdownMenu,
DropdownMenuTrigger,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuCheckboxItem,
DropdownMenuRadioItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuShortcut,
DropdownMenuGroup,
DropdownMenuPortal,
DropdownMenuSub,
DropdownMenuSubContent,
DropdownMenuSubTrigger,
DropdownMenuRadioGroup,
}


// file: docker-ardua/components/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
return twMerge(clsx(inputs))
}


// file: docker-ardua/components/lib/get-user-session.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/components/constants/auth-options';

export const getUserSession = async () => {
const session = await getServerSession(authOptions);

return session?.user ?? null;
};


// file: docker-ardua/components/form/index.ts
export { FormInput } from './form-input';
export { FormTextarea } from './form-textarea';


// file: docker-ardua/components/form/form-input.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { ClearButton } from '@/components/clear-button';
import { ErrorText } from '@/components/error-text';
import { RequiredSymbol } from '@/components/required-symbol';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
name: string;
label?: string;
required?: boolean;
className?: string;
}

export const FormInput: React.FC<Props> = ({ className, name, label, required, ...props }) => {
const {
register,
formState: { errors },
watch,
setValue,
} = useFormContext();

const value = watch(name);
const errorText = errors[name]?.message as string;

const onClickClear = () => {
setValue(name, '', { shouldValidate: true });
};

return (
<div className={className}>
{label && (
<p className="font-medium mb-2">
{label} {required && <RequiredSymbol />}
</p>
)}

        <div className="relative">
          <Input className="h-12 text-md" {...register(name)} {...props} />

          {value && <ClearButton onClick={onClickClear} />}
        </div>

        {errorText && <ErrorText text={errorText} className="mt-2" />}
      </div>
);
};






ESP8266 Control Panel - Connect (если стоит галочка "Auto connect on page load") - то при первой загрузке страницы,
   должно происходить подключение к socket (SocketClient) - хук useAutoConnectSocket подключения - который будет проверять "Auto connect on page load = true" (данные в localStorage)
   то хук дает подключается к сокету как в SocketClient

статус подключение socket отображаться в ESP Connected в (VideoCallApp) .

так же нужно оставить ручное подключение, если "Auto connect on page load" = false
<div className="w-full max-w-md space-y-4 bg-transparent rounded-lg p-6 border border-gray-200 backdrop-blur-sm">
{/* Header and Status */}
<div className="flex flex-col items-center space-y-2">
<h1 className="text-2xl font-bold text-gray-800">ESP8266 Control Panel</h1>
<div className="flex items-center space-x-2">
<div className={`w-4 h-4 rounded-full ${
                            isConnected
                                ? (isIdentified
                                    ? (espConnected ? 'bg-green-500' : 'bg-yellow-500')
                                    : 'bg-yellow-500')
                                : 'bg-red-500'
                        }`}></div>
<span className="text-sm font-medium text-gray-600">
{isConnected
? (isIdentified
? (espConnected ? 'Connected' : 'Waiting for ESP')
: 'Connecting...')
: 'Disconnected'}
</span>
</div>
</div>

                {/* Device Selection */}
                <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-700">Device ID</Label>
                    <div className="flex space-x-2">
                        <Select
                            value={inputDeviceId}
                            onValueChange={handleDeviceChange}
                            disabled={isConnected && !autoReconnect}
                        >
                            <SelectTrigger className="flex-1 bg-transparent">
                                <SelectValue placeholder="Select device"/>
                            </SelectTrigger>
                            <SelectContent className="bg-transparent backdrop-blur-sm border border-gray-200">
                                {deviceList.map(id => (
                                    <SelectItem key={id} value={id} className="hover:bg-gray-100/50">{id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* New Device Input */}
                <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-700">Add New Device</Label>
                    <div className="flex space-x-2">
                        <Input
                            value={newDeviceId}
                            onChange={(e) => setNewDeviceId(e.target.value)}
                            placeholder="Enter new device ID"
                            className="flex-1 bg-transparent"
                        />
                        <Button
                            onClick={saveNewDeviceId}
                            disabled={!newDeviceId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {/* Connection Controls */}
                <div className="flex space-x-2">
                    <Button
                        onClick={() => connectWebSocket(currentDeviceIdRef.current)}
                        disabled={isConnected}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        Connect
                    </Button>
                    <Button
                        onClick={disconnectWebSocket}
                        disabled={!isConnected || autoConnect}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                        Disconnect
                    </Button>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto-reconnect"
                            checked={autoReconnect}
                            onCheckedChange={toggleAutoReconnect}
                            className="border-gray-300 bg-transparent"
                        />
                        <Label htmlFor="auto-reconnect" className="text-sm font-medium text-gray-700">
                            Auto reconnect when changing device
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto-connect"
                            checked={autoConnect}
                            onCheckedChange={handleAutoConnectChange}
                            className="border-gray-300 bg-transparent"
                        />
                        <Label htmlFor="auto-connect" className="text-sm font-medium text-gray-700">
                            Auto connect on page load
                        </Label>
                    </div>
                </div>

                {/* Controls Button */}
                <Button
                    onClick={() => setControlVisible(!controlVisible)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                    {controlVisible ? "Hide Motor Controls" : "Show Motor Controls"}
                </Button>

                {/* Logs Toggle */}
                <Button
                    onClick={() => setLogVisible(!logVisible)}
                    variant="outline"
                    className="w-full border-gray-300 bg-transparent hover:bg-gray-100/50"
                >
                    {logVisible ? (
                        <ChevronUp className="h-4 w-4 mr-2"/>
                    ) : (
                        <ChevronDown className="h-4 w-4 mr-2"/>
                    )}
                    {logVisible ? "Hide Logs" : "Show Logs"}
                </Button>

                {/* Logs Display */}
                {logVisible && (
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-transparent backdrop-blur-sm">
                        <div className="h-48 overflow-y-auto p-2 bg-transparent text-xs font-mono">
                            {log.length === 0 ? (
                                <div className="text-gray-500 italic">No logs yet</div>
                            ) : (
                                log.slice().reverse().map((entry, index) => (
                                    <div
                                        key={index}
                                        className={`truncate py-1 ${
                                            entry.type === 'client' ? 'text-blue-600' :
                                                entry.type === 'esp' ? 'text-green-600' :
                                                    entry.type === 'server' ? 'text-purple-600' :
                                                        'text-red-600 font-semibold'
                                        }`}
                                    >
                                        {entry.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>


Добавить кнопку в \\wsl.localhost\Ubuntu-24.04\home\pi\Projects\docker\docker-ardua\components\header.tsx для отображения и управления моторами с отправкой данных на сервер через
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'


так же сделай кнопку которая даст возможность управления const Joystick = ({ motor, onChange, direction, speed }: JoystickProps) => { через  useMotorControlStore - у

дай абсолютно полные кода, полные код каждого файла, комментарии на русском.