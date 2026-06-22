import "./env.js";
import connectDB from "./db/index.js"
import app from "./app.js";

const port = process.env.PORT || 3000

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.error("ERROR in APP: ",error);
        throw error;
    })

    app.listen(port || 3000, () => {
        console.log(`Server is running at ${port}`);
        
    })
})
.catch((error) => {
    console.error("MongoDb connection failed:",error);
});

//first approach
/*
import express from "express";

const app = express();

(async() => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error", (error) => {
        console.error("ERROR",error);
        throw error;
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
        
       })
    } catch (error) {
        console.error("ERROR",error);
        throw error;
    }
})() //iife --> immediately invoked function expression
*/