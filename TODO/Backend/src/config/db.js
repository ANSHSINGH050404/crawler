import mongoose, { connect } from 'mongoose'


export function connectDB(){

    mongoose.connect(process.env.MONGO_URL)
    .then(()=>{console.log("Connected to MongoDb");
    })
    .catch((err)=>{
        console.log('Falied to Connect to MongoDb',err);
        
    })
}