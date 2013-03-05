var static = require('node-static');
var http = require('http');
var fs = require('fs');
var util = require('util');
var qs = require('querystring');
var portnumber = 9020;
var webroot = '.';
var file = new (static.Server)(webroot, {
  cache:600,
  headers: { 'X-Powered-By' : 'node-static'}
});
//TODO: support up to 20 connections
// http.globalAgent.maxSockets = 20;
http.createServer(function (req, res) {
// create chat buffers
var chatbuffer1;
// regax match /Chat and parse the chatname and line
// save the chat message to the buffer
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
            var body = ''
            // get POST data
            req.on('data', function(chunk) {
              console.log("Received body data:");
              body += chunk;
              console.log(chunk.toString());
            });

            // parse the chat name
            var chatname = ''
            req.on('end', function() {
              var POST = qs.parse(body);
              console.log(POST);
              chatname = POST.chatname;
              console.log("The chat name is: " + chatname);
            });

            // Display the chat room page
            fs.readFile('chatRoom.html?chatname=ttt', function (err, data) {
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
      // res.writeHead(404, "Not found", {'Content-Type': 'text/html'});
      // res.end('<html><head><title>404 - Not found</title></head><body><h1>Not found.</h1></body></html>');
      // console.log("[404] " + req.method + " to " + req.url);
  };

  // Remove users from list when they disconnect
  // req.on("close", function(err) {
  //   console.log("Connection closed unexpectedly");
  // });
  // req.on("end", function(err) {
  //   console.log("Connection closed");
  // });
}).listen(portnumber)
console.log("Server is running at port " + portnumber);
