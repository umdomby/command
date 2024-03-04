// const crypto = require("crypto");
//
// class Encrypter {
//     constructor(encryptionKey) {
//         this.algorithm = "aes-192-cbc";
//         this.key = crypto.scryptSync(encryptionKey, "salt", 24);
//     }
//     encrypt(clearText) {
//         const iv = crypto.randomBytes(16);
//         const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
//         const encrypted = cipher.update(clearText, "utf8", "hex");
//         return [
//             encrypted + cipher.final("hex"),
//             Buffer.from(iv).toString("hex"),
//         ].join("|");
//     }
//     dencrypt(encryptedText) {
//         const [encrypted, iv] = encryptedText.split("|");
//         if (!iv) throw new Error("IV not found");
//         const decipher = crypto.createDecipheriv(
//             this.algorithm,
//             this.key,
//             Buffer.from(iv, "hex")
//         );
//         return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
//     }
// }
// const encrypter = new Encrypter("syndicate_robotics_123");

// const clearText = "123";
// const encrypted = encrypter.encrypt(clearText);
// console.log('1 ' + encrypted)
// const dencrypted = encrypter.dencrypt(encrypted);
// console.log('2 ' + clearText);
// console.log('3 ' + dencrypted);


case "connection":
// const dencrypted = encrypter.dencrypt(msg.id);
// wsg.id = dencrypted