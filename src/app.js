import express from "express"  //express se usualy app banti hai
import cors from "cors"
import cookieParser from "cookie-parser" //iska kaam hai ki mai apne server se jo user ka browswer hai usse cookie access kar paun aur uski cookie set v kr paun basically(CRUD) operation laga paun

const app = express()   //ye banega express se ek method ke through saari properties usme transfer hoti hai

app.use(cors({   // use method middleware aur configuration ke use mein aata hai
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))  

app.use(express.json({limit: "16kb"})) //configuruing express with json how much limit you want to accept
app.use(express.urlencoded({extended: true, limit: "16kb"})) //url ka encoder hai jo cheezo ko convert krta hai special characters ko specially 
app.use(express.static("public"))  //public folder ke liye
app.use(cookieParser())


export { app }
