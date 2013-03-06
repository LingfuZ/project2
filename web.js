var express = require("express"),
    http = require("http"),
	fs = require('fs');

// create a express server
var app = express();
var server = http.createServer(app);
// listen on 9020 port
var port = 9022;
server.listen(port);
var io = require("socket.io").listen(server);

// set polling method and duration
io.configure(function () { 
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 30); 
});

var chatName = null;
var chatLine = null;
var chatBuffer = {room1: {fullMessage:[], online:0}, room2: {fullMessage:[], online:0}, room3: {fullMessage:[], online:0}};

//handle all the http get requests
app.get("*", function(req, res){
	switch(true){
		// handle special chat command
		case /chat\?name=(.+)\&line=(.+)/i.test(req.url):
			// send the chat room page
			res.sendfile(__dirname + "/index.html");
			//get chat name and line
			chatName = req.url.match(/chat\?name=(.+)\&line=(.+)/i)[1];
			chatLine = req.url.match(/chat\?name=(.+)\&line=(.+)/i)[2];
			//format message and put in the buffer
			var message = "<" + chatName + "> : " + chatLine + "\n";
			chatBuffer['room1']['fullMessage'].push(message);
			console.log(message)
			break;
		// set the default page
		case(req.url=="/"):
			res.sendfile(__dirname + "/index.html");			
			break;
		// serve static files
		default:
			console.log("The Client requested this: " + req.url)
			var echo = req.url.match(/\/(.+)/i)[1];
			res.sendfile(__dirname + "/" + echo);
			break;
	}
})

// client connects to server
io.sockets.on("connection", function (socket) {
	chatBuffer['room1']['online'] = Object.keys(socket.manager.open).length;
	
	// when client first connects to the server
	// socket.on("on connected", function (data) {
	// 	if (data.message) {
	// 		var chatRoom = 1;
	// 		var chatName = "";
	// 		if (data.chatRoom)
	// 			chatRoom = data.chatRoom;
	// 		if (data.chatName)
	// 			chatName = (data.chatName == "" ? "Anonymous" : data.chatName);
	// 		if (chatBuffer['room1']['fullMessage'].length > 0) {
	// 			console.log("----------------What's in the buffer------------------");
	// 			console.log(chatBuffer[chatRoom]['fullMessage']);
	// 			sendAll({fullMessage: chatBuffer[chatRoom]['fullMessage'], 
	// 				online: chatBuffer['room1']['online'], connect:true }, socket.id);
	// 		}
	// 	}

	// 	console.log("connected: ", data, " from ", socket.store.id);

	// });

	socket.on("from client", function (data) {
		var chatRoom = data.chatRoom;
		if(data.message){
			chatName = (data.chatName == "" ? "Anonymous" : data.chatName);
			chatBuffer[chatRoom]['fullMessage'].push("<" + chatName + "> : " + data.message + '\n');
		}
		console.log("received: ", data, " from ", socket.store.id);
		var connection_limit = 20;
		// !Should be checked outside of this event when connection established and close connection if exceed 20
		if(Object.keys(socket.manager.open).length <= connection_limit){
			if(chatBuffer['room1']['fullMessage'].length > 0){
				sendAll({fullMessage: chatBuffer[chatRoom]['fullMessage'], 
					online: chatBuffer['room1']['online'], connect:true });
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
