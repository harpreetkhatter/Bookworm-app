import express from "express"
import "dotenv/config"
import authRoutes from "./routes/authRoutes.js"
import bookRoutes from "./routes/bookRoutes.js"
import { connectDB } from "./lib/db.js"

import cors from "cors"
import job from "./lib/cron.js"


const app = express()
job.start()
app.use(express.json())
app.use(cors())


app.use("/api/auth",authRoutes)
app.use("/api/books",bookRoutes)

const PORT = process.env.PORT || 3000


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
  connectDB()
})