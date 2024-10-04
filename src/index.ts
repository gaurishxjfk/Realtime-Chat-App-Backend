import express, { Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes";
import cors from "cors";
import http from "http"
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

io.on('connection',(socket) => {
  console.log("connection is on",socket.id)
})

io.on('connection', (socket) => {
  socket.on('chat-message', ({roomID, msg}) => {
   io.to(roomID).emit('chat-message', msg);
   // socket.broadcast.emit('chat-message', msg);
    console.log('message: ' + roomID, msg, socket.id);
  });
});

app.use(express.json()); 

app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const PORT = process.env.PORT ?? 3000;

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Server is up and running now and forevcer");
});

app.use("/users", router);

server.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
