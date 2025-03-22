disk.yandex.ru/edit/disk/disk%2FЗагрузки%2FТестовое%20задание%20для%20Frontend%20разработчика.docx
firebase login  or  firebase logout

npm install -g firebase-tools


https://console.firebase.google.com/u/0/

Добрый день!

Меня зовут Сергей Кунцевич, я из rabota.by (Hammer Systems – Торнике)
Сегодня мне прислали тестовое задание https://disk.yandex.ru/d/R74ptnVnK5xpPA

Что сделано:
Реализована авторизация (встроил в проект практически свой код). После регистрации слева появляется админ-панель.
Дошел до Pages → User list из демо-проекта (API еще не реализовано).
Потратил больше времени на проработку авторизации, но считаю этот этап важным.
https://hammer-systems-seven.vercel.app
https://github.com/umdom44/HammerSystems


Немного о моем опыте:
Хотя стек проекта отличается от моего основного, я работал с ним ранее (около 5 лет назад). Сейчас использую Next.js, Prisma, server actions, Redis, Kafka, Docker.

Примеры моих проектов:

Heroes3.site – серверная часть содержит (Без API) почти 5000 строк кода (GitHub).
https://github.com/umdomby/heroes3/blob/main/app/actions.ts 
https://heroes3.site/

Видео процесса разработки: YouTube (10 000+ строк кода, менее чем за месяц).
Видео (если интересно) https://www.youtube.com/watch?v=TW_6y45kM9c&list=PLrAwJD5e8M7x7pgSOJwkoz4zFdr2tsZu2&index=2

Вопрос:
Я готов продолжить работу над тестовым, но учитывая его стек (React-Redux), есть опасение, что, потратив на него время, не пройду собеседование из-за несовпадения технологий. Будет ли актуальным обсуждение моего опыта с Next.js и сопутствующим стеком?
Спасибо за внимание! Буду рад обсудить дальнейшие шаги.

С уважением,
Сергей Кунцевич











\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\HammerSystems\starter-boilerplate\src\configs\NavigationConfig.js
\\wsl.localhost\Ubuntu-24.04\home\pi\Projects\HammerSystems\starter-boilerplate\src\components\layout-components\MenuContent.js


firebase init functions


Получения JWT токена и назначения роли админа с использованием Firebase Authentication и Firebase Functions. 
Мы будем использовать ваш существующий файл FirebaseAuth.js и добавим необходимые функции для регистрации и назначения роли админа.

starter-boilerplate\src\auth\FirebaseAuth.js

    import firebase from 'firebase/app';
    import 'firebase/auth';
    import 'firebase/firestore';
    import 'firebase/functions'; // Импортируем функции
    import firebaseConfig from 'configs/FirebaseConfig';
    
    firebase.initializeApp(firebaseConfig);
    
    // Firebase utils
    const db = firebase.firestore();
    const auth = firebase.auth();
    const currentUser = auth.currentUser;
    const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
    const facebookAuthProvider = new firebase.auth.FacebookAuthProvider();
    const twitterAuthProvider = new firebase.auth.TwitterAuthProvider();
    const githubAuthProvider = new firebase.auth.GithubAuthProvider();
    
    // Регистрация пользователя
    const registerUser = async (email, password) => {
    try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log('User registered:', user);
    
            // Получение JWT токена
            const token = await user.getIdToken();
            console.log('JWT Token:', token);
    
            return { user, token };
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    };
    
    // Вызов функции для назначения роли админа
    const addAdminRole = async (email) => {
    const addAdminRoleFunction = firebase.functions().httpsCallable('addAdminRole');
    try {
    const result = await addAdminRoleFunction({ email });
    console.log(result.data.message);
    } catch (error) {
    console.error('Error adding admin role:', error);
    }
    };
    
    // Пример использования
    const registerAndAssignAdmin = async (email, password) => {
    try {
    const { user, token } = await registerUser(email, password);
    console.log('Admin registered with token:', token);
    await addAdminRole(user.email);
    } catch (error) {
    console.error('Registration error:', error);
    }
    };
    
    export {
    db,
    auth,
    currentUser,
    googleAuthProvider,
    facebookAuthProvider,
    twitterAuthProvider,
    githubAuthProvider,
    registerUser,
    addAdminRole,
    registerAndAssignAdmin
    };


starter-boilerplate\functions\index.js

    const functions = require('firebase-functions');
    const functions = require('firebase-functions');
    const admin = require('firebase-admin');
    admin.initializeApp();
    
    exports.addAdminRole = functions.https.onCall((data, context) => {
    // Проверка, что вызов идет от авторизованного пользователя
    if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
    
        // Добавление роли админа
        return admin.auth().getUserByEmail(data.email)
            .then(user => {
                return admin.auth().setCustomUserClaims(user.uid, { admin: true });
            })
            .then(() => {
                return { message: `Success! ${data.email} has been made an admin.` };
            })
            .catch(error => {
                return { error: error.message };
            });
    });


starter-boilerplate\functions\package.json

    {
        "dependencies": {
        "firebase-admin": "^10.0.0",
        "firebase-functions": "^3.18.0"
        }
    }

HammerSystems\starter-boilerplate\src\views\auth-views\components\AdminLogin.js



