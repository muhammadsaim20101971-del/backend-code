
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const Student = require("./Student");

// New teacher: Syed Farhan Ali
const TEACHER_ID = "6adb35e805545ebed6985746";

async function linkStudents() {
    try {
        // Check required environment variable
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from the root .env file.");
        }

        // Validate teacher ID
        if (!mongoose.isValidObjectId(TEACHER_ID)) {
            throw new Error("Invalid teacher ID.");
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected!");

        // Confirm that the teacher exists
        const User = require("./User");
        const teacher = await User.findById(TEACHER_ID);

        if (!teacher) {
            throw new Error("Teacher account not found.");
        }

        console.log("Teacher found:", teacher.name);

        // Find students that do not have a teacher assigned
        const result = await Student.updateMany(
            {
                $or: [
                    { teacher: { $exists: false } },
                    { teacher: null }
                ]
            },
            {
                $set: {
                    teacher: new mongoose.Types.ObjectId(TEACHER_ID)
                }
            }
        );

        console.log("Students linked:", result.modifiedCount);
        console.log("Linking process completed!");

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
}

linkStudents();
