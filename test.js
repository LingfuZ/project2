var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
// regax match 
  // set up some routes
  switch(req.url) {
    case '/':
         //show welcome screen
          console.log("[200] " + req.method + " to " + req.url);
          fs.readFile('index.html', function (err, data) {
            if (err) 
              console.log("Cannot find index.html");
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(data);
        });
      break;
    case '/formhandler':
        if (req.method == 'POST') {
            console.log("[200] " + req.method + " to " + req.url);
            
            req.on('data', function(chunk) {
              console.log("Received body data:");
              console.log(chunk.toString());
            });

            // Display the chat room page
            fs.readFile('chatRoom.html', function (err, data) {
              if (err)
                console.log("Error with chatRoom.html");
              res.writeHead(200, {'Content-Type': 'text/html'});
              res.end(data);
            });

            // req.on('end', function() {
            //   // empty 200 OK response for now
            //   res.writeHead(200, "OK", {'Content-Type': 'text/html'});
            //   res.end();
            // });
            
          } else {
            console.log("[405] " + req.method + " to " + req.url);
            res.writeHead(405, "Method not supported", {'Content-Type': 'text/html'});
            res.end('<html><head><title>405 - Method not supported</title></head><body><h1>Method not supported.</h1></body></html>');
          }
      break;
    case '/getFile':
        fs.readFile('rollover.png', function (err, data) {
          if (err) throw err;
          res.writeHead(200, {'Content-Type': 'image/png'});
          res.end(data);
        });
      break;
    case '/getPage':
        fs.readFile('index.html', function (err, data) {
          if (err) throw err;
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(data);
        });
      break;
    default:
      res.writeHead(404, "Not found", {'Content-Type': 'text/html'});
      res.end('<html><head><title>404 - Not found</title></head><body><h1>Not found.</h1></body></html>');
      console.log("[404] " + req.method + " to " + req.url);
  };
}).listen(8001)
console.log("Server is running at port 8001");
