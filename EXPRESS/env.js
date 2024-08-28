require('dotenv').config()
const port = process.env.SERVER_PORT_HTTPS || 4444
httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});


//.env  --> SERVER_PORT_HTTPS=4444
