/* jshint node: true */
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var robot = require('robotjs');

var adjustment = 2;
var mouse = null;
var newX = null;
var newY = null;

app.use('/public', express.static('public'));

io.on('connection', function(socket) {
  socket.broadcast.emit('hi');
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('mouse', function(pos) {
    if (pos.cmd == 'move' || pos.cmd == 'scroll' || pos.cmd == 'drag') {
      mouse = robot.getMousePos();
      //console.log("Mouse is at x:" + mouse.x + " y:" + mouse.y);
      newX = mouse.x + pos.x * adjustment;
      newY = mouse.y + pos.y * adjustment;
      //console.log('Offset is x:'+ newX + ' y:' + newY);
      //robot.moveMouseSmooth(newX, newY);
      robot.moveMouse(newX, newY);
      mouse = robot.getMousePos();
      //console.log("after x:" + mouse.x + " y:" + mouse.y);
    } else if (pos.cmd == 'click') {
      robot.mouseClick();
      // robot.typeString(msg);
      //Press enter.
      // robot.keyTap("enter");
    } else if (pos.cmd == 'rightclick') {
      robot.mouseClick('right');
    } else if (pos.cmd == 'scrollstart') {
      robot.mouseToggle('down', 'middle');
    } else if (pos.cmd == 'scrollend') {
      robot.mouseToggle('up', 'middle');
    } else if (pos.cmd == 'dragstart') {
      robot.mouseToggle('down', 'left');
    } else if (pos.cmd == 'dragend') {
      robot.mouseToggle('up', 'left');
    }
    // send to everyone
    //io.emit('mouse', pos);
  });
});

var PORT = 8000;
http.listen(PORT, function() {
  console.log('listening on *:' + PORT);
});
