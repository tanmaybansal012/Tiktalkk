import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/db';
import cookieParser from 'cookie-parser'

import authRouter from './routes/authRoute'
import messageRouter from './routes/messageRoute'
import { app, server } from './lib/socket';
import path from 'node:path';
import corsOptions from './config/corsOptions.js'; // adjust path to wherever this file actually is

dotenv.config();
const port = process.env.PORT || 5000;
const frontendPath = path.resolve(
    __dirname,
    "../../Frontend/dist"
);

app.use(cors(corsOptions));  // <-- add this, before routes
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(express.static(frontendPath));
app.use('/api/auth', authRouter);
app.use('/api/messages', messageRouter);

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

server.listen(port, () => {
    console.log(`The server is running on port: ${port}`)
    connectDB();
})