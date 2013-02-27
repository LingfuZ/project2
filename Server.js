//-------------------------------------- THE SERVER ----------------------------------------------
var net = require('net');
var fs = require('fs');
var os = require('os')

//Auto detect the IP address of the machine it's currently running on
var interfaces = os.networkInterfaces();
var addresses = [];
for (k in interfaces) {
    for (k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family == 'IPv4' && !address.internal) {
            addresses.push(address.address)
        }
    }
}

var HOST = addresses[0];
var PORT = 9020;
var ChatBuffer = {chatname: "unknown", content: []};

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer([],function(sock) {
    
    // We have a connection - a socket object is assigned to the connection automatically   
	sock.on('connect', function(){
		console.log('Connected from address: ' + sock.remoteAddress +' and port:  '+ sock.remotePort);
	});
	sock.write('\n*************** WELCOME ***************\n');
	sock.write("You are now connected to Thang's Chatroom\r\n")
	sock.write("\n***************************************\n\n");
	sock.write("Please type 'help' for a list of available commands\n")
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {    
		var response = data.toString().trim();
		console.log(response + "\r\n");
		//Act accordingly
		switch(true){
			//The 'HELP' Protocol
			case /^help$/i.test(response):
				sock.write("----------------------------\r\n");
				sock.write("The available commands are: \r\n");
			    sock.write("----------------------------\r\n");
				sock.write("'help'             : list the commands and their syntax\r\n");
				sock.write("'test: [words]'    : receive a response of [words]\r\n");
				sock.write("'name: [chatname]' : give your chat name in the chat buffer\r\n");
				sock.write("'get'              : receive a response of the entire content of the chat buffer\r\n");
				sock.write("'push: [content]'  : put [chatname]:[content] into the chat buffer\r\n");
				sock.write("'getrange[startline][endline]' : get all the lines within that range in the chat buffer\r\n");
				sock.write("'adios'            : quit the current connection\r\n");
				sock.write("'clear'			   : clear the ChatBuffer and start over\r\n");
				sock.write("'delete [line#]'   : Delete a particular line in the chat buffer\r\n");
				sock.write("'savebuffer'       : Write the chat buffer into a file on the local system\r\n");
				sock.write("'searchbuffer'     : look for a saved chat buffer on server\r\n");
				sock.write("'readbuffer' [filename]: read the content of a saved chat buffer\r\n");
				sock.write("----------------------------\r\n");
				break;
			//The 'TEST' Protocol	
			case /^test:(.+)/i.test(response):
				var echo = response.match(/^test:(.+)/i)[1];
				sock.write(echo + "\r\n");
				break;  
			//The 'NAME' Protocol	
			case /^name:\s?(.+)/i.test(response):
				var chatname = response.match(/^name:\s?(.+)/i)[1];
				ChatBuffer['chatname'] = chatname;
				sock.write("OK!\r\n");
				break;
			//The 'GET' Protocol: return Chat Buffer
			case /^get$/i.test(response):
				sock.write("-----------------------------------------------------\r\n");
				sock.write("Chat Buffer Content:\r\n")
				for(var i=0;i<ChatBuffer['content'].length;i++){
					sock.write((i+1) + "-" + ChatBuffer['content'][i] + "\r\n");
				}
				sock.write("-----------------------------------------------------\r\n");
				break;
			//The 'DELETE' Protocol": remove a line from the chat buffer		
			case /^delete\s+\d+/i.test(response):
				var line = parseInt(response.match(/^delete\s+(\d+)/i)[1]);
				sock.write("-----------------------------------------------------\r\n");
				if(ChatBuffer['content'].length == 0){
					sock.write("Chat Buffer is empty!\r\n");
				}
				else if(line <= 0 || line > ChatBuffer['content'].length){
					sock.write("Line number must be between 0 and the length of the Chat Buffer!");
				}
				else{
					ChatBuffer['content'].splice(line-1,1);
					sock.write("Line " + line + " has been removed from the Chat Buffer :).\r\n");
					sock.write("-----------------------------------------------------\r\n");
				}
				break;
			//The 'PUSH' Protocol: push a line with chatname into the chatbuffer	
			case /^push:/i.test(response):
				var content = response.match(/^push:(.+)/i)[1];
				ChatBuffer['content'].push("[" + new Date().toUTCString() + "] " + ChatBuffer['chatname'] + ":" + content);
				sock.write("OK!\r\n");
				break;
			//The 'GETRANGE' Protocol: Get the content of chat buffer within a range
			case /^getrange\s+(\d+)\s+(\d+)/i.test(response):
				start = parseInt(response.match(/^getrange\s+(\d+)\s+(\d+)/i)[1]);
				end = parseInt(response.match(/^getrange\s+(\d+)\s+(\d+)/i)[2]);
				if(ChatBuffer['content'].length == 0){
					sock.write("ERROR: The Chat Buffer is empty!\r\n");
					break;
				}
				if(end > ChatBuffer['content'].length){
					sock.write("ERROR: The Chat Buffer doesn't have that many lines!\r\n");
					break;
				}
				if(start == 0){
					sock.write("ERROR: Line number starts at 1!\r\n");
					break;
				}
				sock.write("-----------------------------------------------------\r\n");
				sock.write("Chat Buffer Content from line " + start + " and line " + end + ": \r\n")
				for(i = start-1;i<end;i++ ){
					sock.write((i+1) + "-" + ChatBuffer['content'][i] + "\r\n");
				}
				sock.write("-----------------------------------------------------\r\n");
				break;
			//The 'ADIOS' Protocol: terminate the connection
			case /^adios$/i.test(response):
				sock.write("Connection terminated! Goodbye! \r\n");
				sock.destroy();
				break;
			//The 'CLEAR' Protocol: clear the chat buffer	
			case /^clear$/i.test(response):
				ChatBuffer['content'] = [];
				sock.write("Chat buffer has been clear!\n--------------------------------------------------\r\n");
				break;
			//SAVE the chat buffer into a file on the server	
			case /^savebuffer$/i.test(response):
				timestamp = shortdate();
				var toSave = "";
				for(var i = 0; i < ChatBuffer['content'].length; i++){
					toSave = toSave.concat(ChatBuffer['content'][i] + "\r\n");
				}
				fs.writeFile(ChatBuffer['chatname']+"-"+timestamp+".txt" , toSave, function(err){
					if(err){
						console.log(err);
					}
					else{
						sock.write("ChatBuffer successfully saved on server with file name: " + ChatBuffer['chatname']+"-"+timestamp+".txt" + "\r\n");
						console.log("A file was saved with name: " + ChatBuffer['chatname']+"-"+timestamp+".txt\r\n");
					}
				})
				break;
			//SEARCH for a chat buffer starting with the chatname	
			case /^searchbuffer$/i.test(response):
				fs.readdir(process.cwd(), function(err, files){
					if(err){
						console.log(err);
						return;
					}
					console.log("Available files: " + files);
					var regex = new RegExp("\s?" + ChatBuffer['chatname'] + ".+");
					var toShow = [];
					for(var i = 0; i < files.length; i++){
						if(regex.test(files[i])){
							toShow.push(files[i]);
						}
					}
					sock.write("-----------------------------------------------\r\n");
					if(toShow.length == 0){
						sock.write("No chat buffer files matched your chatname!\r\n")
					}
					else{
						sock.write("The chat buffer file(s) that match your chatname:\r\n")
						for(var i = 0; i < toShow.length; i++){
							sock.write(toShow[i] + "\r\n");
						}
					}
					sock.write("-----------------------------------------------\r\n");
				});
				break;
			//READ a specific file chat buffer	
			case /^readbuffer\s+.+$/i.test(response):
			    var fileName = response.match(/^readbuffer\s+(.+)/i)[1];
				fs.readFile(fileName, 'utf8', function(err, data){
					if(err){
						return console.log(err);
					}
					console.log(data + "\r\n");
					sock.write("-----------------------------------------------\r\n");
					sock.write("The chat buffer content of " + fileName + " :\r\n");
					sock.write(data + "\r\n");
					sock.write("-----------------------------------------------\r\n");
				})
				break;
			default:
				sock.write("ERROR: Wrong command or syntax. Please type 'help' for a list of available commands and syntax.\r\n");
				break;
		}	

    });

	
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    
}).listen(PORT, HOST);


//A function to return a string of number representing the current Date and Time
//Used for saving Buffer file
function shortdate(){
	var date = new Date();
		return date.getDay().toString()+date.getMonth().toString()+date.getFullYear().toString()+"-"+date.getHours().toString()
		+date.getMinutes().toString()+date.getSeconds().toString();
}

//console.log('Server listening on ' + HOST +':'+ PORT);
console.log('*************************************************************');
console.log("Thang's Chatroom started");
console.log('*************************************************************');