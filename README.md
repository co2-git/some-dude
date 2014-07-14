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

    npm install https://github.com/co2-git/some-dude
    cd some-dude/public
    bower install
    cd ..
    dude install mongodb redis
    dude run mongodb bin/start --port 33368 --dbpath data/
    dude run redis src/redis-server --port 33369
    dude build
    dude start server.js
    # dude reload server.js
    # dude stop
