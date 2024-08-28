const publicPath = path.join(__dirname, '../client/build');
app.use(express.static(publicPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

require('dotenv').config()
const port = process.env.SERVER_PORT_HTTPS || 4444
httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});