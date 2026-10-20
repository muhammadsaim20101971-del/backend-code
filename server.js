
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

// GET: Fetch all students
app.get("/students", async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        console.error("Fetch error:", error.message);
        res.status(500).json({ message: "Failed to fetch students" });
    }
});

// POST: Add a student
app.post("/students", async (req, res) => {
    try {
        const { name, age, course, email } = req.body;

        if (!name || age === undefined || !course || !email) {
            return res.status(400).json({
                message: "Name, age, course and email are required."
            });
        }

        const student = await Student.create({
            name,
            age,
            course,
            email
        });

        res.status(201).json(student);
    } catch (error) {
        console.error("Add error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// PUT: Edit a student
app.put("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const { name, age, course, email } = req.body;

        const student = await Student.findByIdAndUpdate(
            id,
            { name, age, course, email },
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json(student);
    } catch (error) {
        console.error("Update error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// DELETE: Remove a student
app.delete("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json({
            message: "Student deleted successfully.",
            student
        });
    } catch (error) {
        console.error("Delete error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// Start server after connecting to MongoDB
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
