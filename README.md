# some dude's blog

The source of some-dude-blog.com

Powered by:

- NodeJS
- Express
- MongoDB
- Redis
- Dude
- Bower
- Foundation
- SASS
- Font Awesome
- jQuery
- Prism
- Github

Hosted by:

- joyent (ubuntu instance 512MB) => nodejs server + redis server
- joyent (ubuntu instance 512MB) => mongodb server

# Install

Recommended OS: Ubuntu 14 64bits

    # install node modules and npm dependencies
    npm install https://github.com/co2-git/some-dude
    
    # config file
    cat << CONFIG > .config.json
    {
        "mongodb": {
            "host": Your host here,
            "port": Your port here,
            "db": Your db here,
            "auth": {
                "user": Your user here,
                "password": Your password here
            }
        }
    }
    CONFIG
    
    # install bower components
    cd some-dude/public
    bower install
    cd ..
    
    # install mongodb and redis
    dude install
    
    # build environment
    dude build
    
    # start services
    dude start
    
    # Reload the server with 0 second downtime
    dude reload server.js
    
    # Stop all services
    dude stop
