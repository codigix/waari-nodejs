// app/s/broadcastService.js
const socketIO = require("socket.io");

class BroadcastService {
  boot(server) {
    const io = socketIO(server, {
      cors: {
        origin: "*", // Change this to your frontend domain
      },
    });

    console.log("Broadcast service booted");

    // Equivalent to Laravel's routes/channels.php
    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Example channel event
      socket.on("message", (data) => {
        console.log("Received message:", data);
        io.emit("message", data); // broadcast to all clients
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
}

module.exports = new BroadcastService();
