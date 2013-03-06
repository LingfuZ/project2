var express = require("express"),
    http = require("http"),
    fs = require('fs');
// static server
var webroot = '.';
var file = new (static.Server)(webroot, {
  cache:600,
  headers: { 'X-Powered-By' : 'node-static'}
});
var static = require('node-static');

var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
});

var port = 9020;
server.listen(port);

app.get("/", function (req, res) {
    res.sendfile(__dirname + "/index.html");
    req.addListener('end', function() {
        file.serve(req, res, function(err, result) {
          if (err) {
            console.error('Error serving %s - %s', req.url, err.message);
            if (err.status === 404 || err.status === 500) {
              // file.serveFile(util.format('/%d.html', err.status), err.status, {}, req, res);
            } else {
              res.writeHead(err.status, err.headers);
              res.end();
            }
          } else {
            console.log('%s - %s', req.url, res.message);
          }
        });
});

io.sockets.on("connection", function (socket) {
    socket.emit("from server", { message: "Welcome to Larry and Thang's Chat Room!" });
    sendAll({online: Object.keys(socket.manager.open).length});
    socket.on("from client", function (data) {
    console.log("received: ", data, " from ", socket.store.id);

    if (data.message)
        sendAll(data, socket.id);
    });
    
    socket.on("disconnect", function(reason) {
        sendAll({online: Object.keys(socket.manager.open).length});
    });
});

function sendAll(message, user) {
    for (var socket in io.sockets.sockets) {
        if (socket != user)
            io.sockets.sockets[socket].emit("from server", message);
    }
}

