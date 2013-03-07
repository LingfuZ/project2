/*********************************
// Name: Thang Nguyen and Larry Zhang
// IT 347
// HTTP Chat Server 
*********************************/

var express = require("express"),
    http = require("http"),
	fs = require('fs');

// create a express server
var app = express();
var server = http.createServer(app);

// listen on 9020 port
var port = 9020;
server.listen(port);
var io = require("socket.io").listen(server);

//Initialize the chat buffers
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

	// Set the max number of connections
	var connection_limit = 20;
	//If the connection reaches limit, emit an reject event back to the client
	if(Object.keys(socket.manager.open).length > connection_limit){
		console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~reach connections limit");
		socket.emit("reject");
	}
	
	//When the server receives message from client, push the data into the appropriate buffer
	socket.on("from client", function (data) {
		var chatRoom = data.chatRoom;
		//When message is received, push the message to the right room buffer and then broadcast to all clients
		if(data.message){
			chatName = (data.chatName == "" ? "Anonymous" : data.chatName);
			chatBuffer[chatRoom]['fullMessage'].push("<" + chatName + "> : " + data.message + '\n');
		}
		console.log("received: ", data, " from ", socket.store.id);
		if(chatBuffer['room1']['fullMessage'].length > 0){
			sendAll({fullMessage: chatBuffer[chatRoom]['fullMessage'],chatRoom: chatRoom, online: chatBuffer['room1']['online']});
		}
			
	});
	
	//Do push the number of online users back to all clients.
	socket.on("disconnect", function(reason) {
		sendAll({online: Object.keys(socket.manager.open).length});
	});
});

//Configure the express static server. This is used to serve up the files
app.configure(function() {
	app.use(express.static(__dirname + '/'));
});

//Iterate through all the sockets and broadcast the appropriate buffer to them
function sendAll(message, user) {
    for (var socket in io.sockets.sockets) {
        if (socket != user)
            io.sockets.sockets[socket].emit("from server", message);
    }
}
