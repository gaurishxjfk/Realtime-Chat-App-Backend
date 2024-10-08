import express, { Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes";
import cors from "cors";

import { app, server } from "./socket/socket";

dotenv.config();


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
