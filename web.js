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
var port = 9020;
server.listen(port);
var io = require("socket.io").listen(server);

io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 60); 
});


var chatName = null;
var chatLine = null;
var chatBuffer = {room1: {fullMessage:[]}, room2: {fullMessage:[]}, room3: {fullMessage:[]}};

app.get("*", function(req, res){
	switch(true){
		case /chat\?name=(.+)\&line=(.+)/i.test(req.url):
			res.sendfile(__dirname + "/index.html");
			chatName = req.url.match(/chat\?name=(.+)\&line=(.+)/i)[1];
			chatLine = req.url.match(/chat\?name=(.+)\&line=(.+)/i)[2];
			var message = chatName + " : " + chatLine + "\n";
			chatBuffer['room1']['fullMessage'].push(message);
			console.log(message)
			break;
		case(req.url=="/"):
			res.sendfile(__dirname + "/index.html");
			io.sockets.on("connection", function (socket) {
				socket.emit("from server", { message: "Welcome to Larry and Thang's Chat Room!\n" });
				sendAll({online: Object.keys(socket.manager.open).length});
				
				socket.on("from client", function (data) {
					if(data.message){
						chatBuffer['room1']['fullMessage'].push(data);
					}
					console.log("received: ", data, " from ", socket.store.id);
					for(var line in chatBuffer['room1']['fullMessage']){
						socket.emit("from server", { message: line });
					}
					//if (data.message){
						//sendAll(data, socket.id);
					//}	
				});
				
				socket.on("disconnect", function(reason) {
					sendAll({online: Object.keys(socket.manager.open).length});
				});
			});	
			
			
			break;
		default:
			console.log("The Client requested this: " + req.url)
			var echo = req.url.match(/\/(.+)/i)[1];
			res.sendfile(__dirname + "/" + echo);
			break;
	}
})

app.configure(function() {
	app.use(express.static(__dirname + '/'));
});

/**
io.sockets.on("connection", function (socket) {
    socket.emit("from server", { message: "Welcome to Larry and Thang's Chat Room!\n" });
    sendAll({online: Object.keys(socket.manager.open).length});
	
    socket.on("from client", function (data) {
		if(data.message){
			chatBuffer['room1']['fullMessage'].push(data);
		}
		console.log("received: ", data, " from ", socket.store.id);
		for(var line in chatBuffer['room1']['fullMessage']){
			socket.emit("from server", { message: line });
		}
		//if (data.message){
			//sendAll(data, socket.id);
		//}	
    });
    
    socket.on("disconnect", function(reason) {
        sendAll({online: Object.keys(socket.manager.open).length});
    });
});
**/

function sendAll(message, user) {
    for (var socket in io.sockets.sockets) {
        if (socket != user)
            io.sockets.sockets[socket].emit("from server", message);
    }
}
