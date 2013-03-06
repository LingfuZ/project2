var express = require("express"),
    http = require("http"),
    fs = require('fs');

var static = require('node-static');
// static server
var webroot = '.';
var file = new (static.Server)(webroot, {
  cache:600,
  headers: { 'X-Powered-By' : 'node-static'}
});

var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 60); 
});

app.get("/", function (req, res) {
    res.sendfile(__dirname + "/index.html");
});

app.get("/Chat", function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<html><body><p>The req is : " + req + "</p></body></html>");
    console.log("********************************" + req);
});

app.configure(function() {
    // app.use(express.methodOverride());
    // app.use(express.bodyParser());
    app.use(express.static(__dirname + '/'));
    // app.use(express.errorHandler({
    //     dumpExceptions: true, 
    //     showStack: true
    // }));
    // app.use(app.router);
});

var port = 9020;
server.listen(port);

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
