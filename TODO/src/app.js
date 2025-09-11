import express from 'express'
import router from './routes/user.route.js';
import morgan from 'morgan'

const app=express();

app.use(express.json());
app.use("/user",router)
app.use(morgan())
app.get('/',(req,res)=>{
    
    res.send("node");
})



export default app;