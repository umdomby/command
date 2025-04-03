sudo apt install mkcert
mkcert -install
mkcert localhost

"scripts": {
"start": "HTTPS=true SSL_CRT_FILE=localhost.pem SSL_KEY_FILE=localhost-key.pem react-scripts start"
}