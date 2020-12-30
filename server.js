/* jshint node: true */
'use strict';

var _ = require('lodash'); 
var ps = require('current-processes'); 

let robot = require("robotjs");
let Jimp = require('jimp');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./public/js/config.js'); 
var exec = require('child_process').execFile;

var mainView = {
  X: 3226,
  Y: 954,
  W: 597,
  H: 1400
};

var mainViewMap = {
  X: 3226,
  Y: 954,
  W: 597,
  H: 1400
};

var mainViewHole = {
  X: 1459,
  Y: 635,
  W: 900,
  H: 1866
};

var ref = require('ref-napi');
var ffi = require('ffi-napi');

var stringPtr = ref.types.CString;
var user32 = new ffi.Library('user32', {
    'GetForegroundWindow': ['long', []],
    'GetWindowTextA' : ['long', ['long', stringPtr, 'long']]
});

function checkMode(){
  var foregroundHWnd = user32.GetForegroundWindow(); 
  var buf, name, ret;
  buf = new Buffer.alloc(255);
  ret = user32.GetWindowTextA(foregroundHWnd, buf, 255);
  
  console.log("Current window foregrounded is: "+_.startsWith(buf.readCString(),'GSpro')); 
}


function checkForProcesses(){
  ps.get(function(err,processes){
    var filtered = _.filter(processes,{'name': 'GSpro'})
    var sorted = _.sortBy(processes, 'cpu'); 
    var top5 = sorted.reverse().splice(0,5); 
  
    console.log(_.isEmpty(filtered)?'Not running GSPro':'Running GSPro'); 
  });
}

function broadcastRegion(emitName,x,y,width,height){
  let image = robot.screen.capture(x,y,width,height);
  for(let i=0; i < image.image.length; i++){
      if(i%4 == 0){
          [image.image[i], image.image[i+2]] = [image.image[i+2], image.image[i]];
      }
  }

  var jimg = new Jimp(image.width, image.height);
  jimg.bitmap.data = image.image;
  jimg.resize(image.width/2,image.height/2); 
  jimg.rgba(true);
  jimg.filterType(1); 
  jimg.deflateLevel(5);
  jimg.deflateStrategy(1);
  jimg.getBuffer(Jimp.MIME_PNG, (err, result)=>{
      io.emit(emitName,result);
  });  
}

function broadcastMap(){
  broadcastRegion('update-map',mainView.X,mainView.Y,mainView.W,mainView.H);
}


function broadcastScoreboard(){
  broadcastRegion('update-scoreboard',0,0,990,180);
}

function gsProOpenOptions(){
  robot.setMouseDelay(50); 
  robot.moveMouse(getCord(3816),getCord(77));
  robot.mouseClick(); 
  robot.moveMouse(getCord(3620),getCord(506));
  robot.mouseClick(); 
}

var DIM = {
  X: 3840,
  Y: 2160,
};



var DPI = 1.5; 
// x, y parameters are in range from 0 to getScreenSize()
function getPixelColor(x, y) {
    return robot.getPixelColor(getRealX(x), getRealY(y));
}

function getCord(p){
  return p/DPI; 
}

function getRealX(x){
  var robotScreen = robot.getScreenSize();
  return x/robotScreen.width * DIM.X;
}
function getRealY(y){
  var robotScreen = robot.getScreenSize();
  return y/robotScreen.width * DIM.Y;
}


// Get screen size from NW desktop
try {
  var screen = robot.getScreenSize();
  console.log(screen.width*1.5+ "x" + screen.height*1.5);

//  screenWidth = screen.width;
 // screenHeight =  screen.height;
} catch (e) {
  console.log(e);
}

var adjustment = 2;
var mouse = null;
var newX = null;
var newY = null;

setInterval(broadcastMap,150); 
setInterval(broadcastScoreboard,1000); 
setInterval(checkMode,10000); 

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/client.html');
});

app.use('/public', express.static('public'));

io.on('connection', function(socket) {
  socket.broadcast.emit('hi');
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('update-img', function(){
    

  }); 
  socket.on('key', function(cmd){
    console.log(cmd+' received'); 
    if(cmd=='putter'){
      //putter(); 
      robot.setMouseDelay(50); 
      robot.moveMouse(getCord(69),getCord(2088));
      //1040 1929
      robot.mouseClick(); 
      robot.moveMouse(getCord(1040),getCord(1929));
      robot.mouseClick(); 
    }else if(cmd=='viewHole'){
      robot.keyTap('f3'); 
    }else if(cmd=='freeFloat'){
      robot.keyTap('f5'); 
    }else if(cmd=='greenGrid'){
      robot.keyTap('G'); 
    }else if(cmd=='losInvisible'){
      robot.keyTap('B');
    }else if(cmd=='clubUp'){
      robot.keyTap('K'); 
    }else if(cmd=='clubDown'){
      robot.keyTap('I'); 
    }else if(cmd=='keyUp'){
      robot.keyTap('up'); 
    }else if(cmd=='keyDown'){
      robot.keyTap('down'); 
    }else if (cmd=='greenView'){
      mainView= mainViewHole; 
    } else if (cmd=='holeView'){
      mainView = mainViewMap; 
    }
    else if (cmd=='simDrop'){
      gsProOpenOptions(); 
      robot.moveMouse(getCord(1411),getCord(1064));
      robot.mouseClick(); 
    }
    else if (cmd=='mulligan'){
      gsProOpenOptions(); 
      robot.moveMouse(getCord(2422),getCord(1164));
      robot.mouseClick(); 
    }
    else if (cmd=='concede'){
      gsProOpenOptions(); 
      robot.moveMouse(getCord(2413),getCord(1059));
      robot.mouseClick(); 
    }
    else if (cmd=='rehit'){
      gsProOpenOptions(); 
      robot.moveMouse(getCord(1913),getCord(1158));
      robot.mouseClick(); 
    }
    else if (cmd=='closeBallOptions'){
      robot.moveMouse(getCord(2591),getCord(896));
      robot.mouseClick(); 
    }
    else if(cmd=='keyLeft'){
      robot.moveMouse(1200,800);
      robot.mouseToggle("down");
      setTimeout(function()
      {
          robot.mouseToggle("up");
      
      }, 300);
      
    }else if(cmd=='keyRight'){
      robot.moveMouse(1400,800);
      robot.mouseToggle("down");
      setTimeout(function()
      {
          robot.mouseToggle("up");
      
      }, 300);
    }
  }); 
  socket.on('mouse', function(pos) {
    if (pos.pw) {
      if (config.passcode !== pos.pw) {
        return;
      }
    }
    if (pos.cmd == 'move' || pos.cmd == 'scroll' || pos.cmd == 'pan'|| pos.cmd=='press' || pos.cmd=='pressup')  {
      mouse = robot.getMousePos();
      //console.log("action sensed: "+ pos.cmd); 
      //console.log("Pos is at x:" + pos.x + " y:" + pos.y);
      //console.log("Mouse is at x:" + mouse.x + " y:" + mouse.y);
      //newX = Math.max( mouse.x + pos.x * adjustment , 2150+pos.x*adjustment);
      newX =pos.x >= 0 ? mainView.X/DPI +pos.x* DPI: mouse.x; 
     // newY = Math.max( mouse.y + pos.y * adjustment , 638+pos.y*adjustment);
      newY = pos.y >= 0 ? mainView.Y/DPI +pos.y*DPI : mouse.y;
      //console.log('Offset is x:'+ newX + ' y:' + newY);
      //robot.moveMouseSmooth(newX, newY);
      robot.moveMouse(newX, newY);
      mouse = robot.getMousePos();
      console.log("after x:" + mouse.x + " y:" + mouse.y);
    }  else if (pos.cmd == 'click') {
      robot.mouseClick();
      // robot.typeString(msg);
    } else if (pos.cmd == 'rightclick') {
      robot.mouseClick('right');
    } else if (pos.cmd == 'scrollstart') {
      robot.mouseToggle('down', 'left');
    } else if (pos.cmd == 'scrollend') {
      robot.mouseToggle('up', 'left');
    } else if (pos.cmd == 'panstart'||pos.cmd=="pressstart") {
      robot.mouseToggle('down', 'left');
    } else if (pos.cmd == 'panend'||pos.cmd=="pressupend") {
      robot.mouseToggle('up', 'left');
    } else if (pos.cmd == 'right') {
      robot.keyTap("right");
    } else if (pos.cmd == 'left') {
      robot.keyTap("left");
    } 
    // send to everyone
    //io.emit('mouse', pos);
  });
});

var PORT = 80;
http.listen(PORT, function() {
  console.log('listening on *:' + PORT);
});

