
const mongoose = require("mongoose");
const Student = require("./Student");
const { uri } = require("./index");

async function addStudents() {
    try {
        await mongoose.connect(uri);

        console.log("MongoDB connected!");

        const students = [
            {
                name: "Ali",
                age: 18,
                course: "Web Development",
                email: "ali@example.com"
            },
            {
                name: "Ahmed",
                age: 19,
                course: "Computer Science",
                email: "ahmed@example.com"
            },
            {
                name: "Saim",
                age: 17,
                course: "Node.js",
                email: "saim@example.com"
            }
        ];

        const result = await Student.insertMany(students);

        console.log("Students added successfully!");
        console.log(result);
    } catch (error) {
        console.error("Error adding students:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

addStudents();
