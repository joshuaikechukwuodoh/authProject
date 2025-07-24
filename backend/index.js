import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRoute from "./routes/auth.route.js";
import verifyRoute from "./routes/auth.route.js";


import { connectDB } from "./db/connectDB.js";

dotenv.config();
const app = express();


const port = process.env.PORT   || 3000;             


// database connection
connectDB();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(
    {
        origin: process.env.CLIENT_URL,
        credentials: true,
        exposedHeaders: ["set-cookie"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        preflightContinue: false,
        optionsSuccessStatus: 200,
        maxAge: 3600,
    }
));


// routes
app.use("/api/auth", authRoute);
app.use("/api/verify", verifyRoute);


// server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});