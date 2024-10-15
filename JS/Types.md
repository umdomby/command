Type	    typeof 	    Object wrapper
Null	    "object"	N/A
Undefined   "undefined"	N/A
Boolean	    "boolean"	Boolean
Number	    "number"	Number
BigInt	    "bigint"	BigInt
String	    "string"	String
Symbol	    "symbol"	Symbol


typeof "John"         // Returns string
typeof ("John"+"Doe") // Returns string
typeof 3.14           // Returns number
typeof 33             // Returns number
typeof (33 + 66)      // Returns number
typeof true           // Returns boolean
typeof false          // Returns boolean
typeof 1234n          // Returns bigint
typeof Symbol()       // Returns symbol
typeof x              // Returns undefined