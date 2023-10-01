const express = require("express");
require('dotenv').config()
const fs = require('fs');
const app = express();
const PORT = 4000;

const http = require("http").Server(app);
const cors = require("cors");

app.use(cors());

const rawData = fs.readFileSync('messages.json');
const messagesData = JSON.parse(rawData);


const socketIO = require("socket.io")(http, {
  cors: {
    origin: "*",
    //origin: process.env.URL_SOCKET,
  },
});

let users = [];

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("message", data => {
    messagesData["messages"].push(data)
    const stringData = JSON.stringify(messagesData, null, 2)
    fs.writeFile("messages.json", stringData, (err)=> {
      console.error(err)
    })
    socketIO.emit("messageResponse", data)
  })

  socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data));

  socket.on("newUser", (data) => {
    
    users.push(data);
    console.log(users);
   
    socketIO.emit("newUserResponse", users);
  });

  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
    
    users = users.filter((user) => user.socketID !== socket.id);
    
    socketIO.emit('newUserResponse', users);
    socket.disconnect();
  });
});

app.get('/api', (req, res) => {
  res.json(messagesData);
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
