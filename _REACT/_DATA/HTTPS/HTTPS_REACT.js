const fs = require('fs');
const http = require('http');
const HTTPS_REACT = require('_REACT/_DATA/HTTPS/HTTPS_REACT');
const express = require('express');
const path = require('path')

const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/privkey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/cert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/chain.pem'));

const app = express()
app.use(express.static(__dirname))
app.use(express.static(path.resolve(__dirname, 'build')))

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpServer = http.createServer(function(req, res) {
    res.redirect('https://' + req.headers.host + req.url);
})
httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
});

const httpsServer = HTTPS_REACT.createServer(credentials, app);
app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

httpsServer.listen(443, () => {
    console.log('HTTPs.md Server running on port 443');
});