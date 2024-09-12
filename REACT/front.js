const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const path = require('path')

// const privateKey = fs.readFileSync(path.resolve('/etc/letsencrypt/live/gamerecords.site/privkey.pem'));
// const certificate = fs.readFileSync(path.resolve('/etc/letsencrypt/live/gamerecords.site/cert.pem'));
// const ca = fs.readFileSync(path.resolve('/etc/letsencrypt/live/gamerecords.site/chain.pem'));
//
// const credentials = {
//     key: privateKey,
//     cert: certificate,
//     ca: ca
// };

const app = express()
app.use(express.static(__dirname))
app.use(express.static(path.resolve(__dirname, 'build')))


const httpServer = http.createServer(app);
app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

httpServer.listen(8082, () => {
    console.log('HTTP Server running on port 8082');
});
