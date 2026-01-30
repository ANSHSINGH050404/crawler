import redisClient from "./client.js";
import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";


dotenv.config();
const app = express();

app.use(cors({
  origin:  "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

const RedisStore = connectRedis(session);

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret:"scretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 10 // 10 minutes
    }
})
);
app.use("/auth", authRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));





    
