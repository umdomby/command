npx create-react-app@5.0.1 . 

#Error: error:0308010C:digital envelope routines::unsupported
export NODE_OPTIONS=--openssl-legacy-provider
or
"start": "react-scripts --openssl-legacy-provider start"
or
"start": "SET NODE_OPTIONS=--openssl-legacy-provider && react-scripts start",


HTTPS=true
#ERROR HTTPS 3000 port
DANGEROUSLY_DISABLE_HOST_CHECK=true
SKIP_PREFLIGHT_CHECK=true

HTTPS=true

yarn add react-scripts

npx install cross-env
