
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const Student = require("./Student");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Student API is running!");
});

// Get students from MongoDB
app.get("/students", async (req, res) => {
    try {
        const students = await Student.find();

        res.status(200).json(students);
    } catch (error) {
        console.error("Error fetching students:", error.message);

        res.status(500).json({
            message: "Failed to fetch students"
        });
    }
});

// Start server after database connection
async function startServer() {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error("MONGODB_URI is missing in .env file");
        }

        await mongoose.connect(uri);

        console.log("MongoDB connected successfully!");

        app.listen(5000, () => {
            console.log("Server running at http://localhost:5000");
        });
    } catch (error) {
        console.error("Startup error:", error.message);
    }
}

startServer();
