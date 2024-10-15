# Array Type
let list: number [] = [1,2,3];
let list: Array<number> = [1,2,3];

# Tuple Type
let x: [string, number];
x = [""hello", 10];


let y: [string, number] = ["goodBuy", 42];

let y: [any, any] = ["goodBuy", 42];
let z: Array<any> = [10,"hello"];

let notSure : any = false;

notSure = true; // boolean
notSure = 43; // number
notSure = "hello"; //string

# Enum Type
enum Directions {
    Up,
    Down,
    Left,
    Right
}

Directions.Up;
Directions.Down;
Directions.Left;
Directions.Right;

# Enum Type index
enum Directions {
    Up = 2,
    Down = 4,
    Left = 6,
    Right
}

# never
# Пример с прерыванием
function error(message: string): never {
    throw new Error(message);
}

# Бесконечный цикл
function infiniteLoop(): never {
    while (true) {
    }
}

# Божественная рекурсия
function infiniteRec(): never {
    return infiniteRec();
}

# Object
const car: { type: string, model: string, year: number } = {
    type: "Toyota",
    model: "Corolla",
    year: 2009
};

const create = (o: object | null): void => { };
    create(1);
    create('42');
    create({ obj: 1});

let id: number | string;
    id = 10;
    id = '42';
    id = true;

# type Name
type Name = string'
let id: Name;
id = "42";
id = 10;
