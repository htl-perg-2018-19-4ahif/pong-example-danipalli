import express = require('express');
import http = require('http');
import path = require('path');
import sio = require('socket.io');
import ball = require('./ball');


const app = express();
app.use(express.json());
app.use(express.static(path.join(path.dirname(__dirname), 'client')));
const server = http.createServer(app);

interface IPlayer {
  name: string;
  score: number;
}
let players: IPlayer[] = [];

let gameRounds: number;

const port = 8090;
server.listen(port, () => console.log(`Server is listening on port ${port}...`));
let socket = sio(server);

export function sendLeftPoints(num:number) {
  players[0].score = num;
  if(num >= gameRounds){
    socket.emit('gameover', players);
    socket.emit('leftPoint', 0);
    return false;
  }
  socket.emit('leftPoint', num);
  return true;
}

export function sendRightPoints(num:number) {
  players[1].score = num;
  if(num >= gameRounds){
    socket.emit('gameover', players);
    socket.emit('rightPoint', 0);
    return false;
  }
  socket.emit('rightPoint', num);
  return true;
}

export function sendBallPosition(x:number, y:number){
  socket.emit('ball',x, y);
}

// Handle the connection of new websocket clients
socket.on('connection', (socket) => {
  socket.on('login', function (newUserName) {
    let player: IPlayer = newUserName;
    if (players.length < 2) {
      players.push(player);
      socket.emit('login success', players.length);
    }
  });

  socket.on('start game', function (clientHeight, clientWidth, ballHeight, ballWidth, paddleWidth: number, paddleHeight: number, paddleLeft:number, rounds: number) {
    if (players.length === 2) {
      gameRounds = rounds;
      socket.emit('game started');
      socket.broadcast.emit('game started');
      ball.ballFunction(clientHeight, clientWidth, ballHeight, ballWidth, paddleWidth, paddleHeight, paddleLeft);
    }
  });


  // Handle an ArrowKey event
  socket.on('ArrowKey', function (code, name) {
   if(players[0].name == name){
      ball.setLeftPaddle(code);
    }else{
      ball.setRightPaddle(code);
    };
    // Broadcast the event to all connected clients except the sender
    socket.broadcast.emit('ArrowKey', code);
  });

});
