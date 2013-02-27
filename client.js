//-------------------- THE CLIENT ---------------------------------------------------
var net = require('net');
var HOST = null;
var PORT = 9020;

//Go through the command line and get the PORT and HOST to connect
process.argv.forEach(function (val, index, array) {
  if(index == 2){
	HOST = val;
  }
  if(index == 3){
	PORT = val;
  }
});

var client = new net.Socket();
client.connect(PORT, HOST, function() {
	//do something if needed
});

//Resume the process.stdin for input
process.stdin.resume();
process.stdin.setEncoding('utf8');
 
//Write the data to server 
process.stdin.on('data', function (chunk) {
 client.write(chunk + "\r\n" );
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {
    console.log(data + "\r\n");
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
	// Close the client socket completely
    client.destroy();
    console.log('Chatroom Disconnected!\r\n');
	process.exit();
});