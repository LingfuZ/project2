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
    io.set("polling duration", 30); 
});


var chatName = null;
var chatLine = null;
var chatBuffer = {room1: {fullMessage:[], online:0}, room2: {fullMessage:[], online:0}, room3: {fullMessage:[], online:0}};

app.get("*", function(req, res){
	switch(true){
		case /chat\?name=(.+)\&line=(.+)/i.test(req.url):
			res.sendfile(__dirname + "/index.html");
			chatName = req.url.match(/chat\?name=(.+)\&line=(.+)/i)[1];
			chatLine = req.url.match(/chat\?name=(.+)\&line=(.+)/i)[2];
			var message = "<" + chatName + "> : " + chatLine + "\n";
			chatBuffer['room1']['fullMessage'].push(message);
			console.log(message)
			break;
		case(req.url=="/"):
			res.sendfile(__dirname + "/index.html");			
			break;
		default:
			console.log("The Client requested this: " + req.url)
			var echo = req.url.match(/\/(.+)/i)[1];
			res.sendfile(__dirname + "/" + echo);
			break;
	}
})

io.sockets.on("connection", function (socket) {
	chatBuffer['room1']['online'] = Object.keys(socket.manager.open).length;
	
	socket.on("from client", function (data) {
		var chatRoom = data.chatRoom;
		if(data.message){
			chatName = (data.chatName == "" ? "Anonymous" : data.chatName);
			chatBuffer[chatRoom]['fullMessage'].push("<" + chatName + "> : " + data.message + '\n');
		}
		console.log("received: ", data, " from ", socket.store.id);
		var connection_limit = 20;
		if(Object.keys(socket.manager.open).length <= connection_limit){
			if(chatBuffer['room1']['fullMessage'].length > 0){
				sendAll({fullMessage: chatBuffer[chatRoom]['fullMessage'], online: chatBuffer['room1']['online'], connect:true })
			}
		}
		else{
			socket.emit('from server', { fullMessage: [], online: chatBuffer['room1']['online'], connect:false });
			socket.disconnect();
		}	
	});
	
	socket.on("disconnect", function(reason) {
		sendAll({online: Object.keys(socket.manager.open).length});
	});
});


app.configure(function() {
	app.use(express.static(__dirname + '/'));
});


function sendAll(message, user) {
    for (var socket in io.sockets.sockets) {
        if (socket != user)
            io.sockets.sockets[socket].emit("from server", message);
    }
}
