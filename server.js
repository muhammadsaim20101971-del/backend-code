
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const User = require("./User");
const Student = require("./Student");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

// ==================================
// CORS CONFIGURATION
// ==================================

const allowedOrigins = [
    "http://localhost:3000",
    "https://frontend-data-seven.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    }
}));

app.use(express.json());

// ==================================
// AUTHENTICATION MIDDLEWARE
// ==================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    if (!JWT_SECRET) {
        return res.status(500).json({
            message: "Authentication is not configured."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
}

// ==================================
// TEST ROUTE
// ==================================

app.get("/", (req, res) => {
    res.send("Student API is running!");
});

// ==================================
// TEACHER SIGNUP
// ==================================

app.post("/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Signup error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            message: "Unable to create account."
        });
    }
});

// ==================================
// TEACHER LOGIN
// ==================================

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        if (!JWT_SECRET) {
            return res.status(500).json({
                message: "JWT_SECRET is missing from environment variables."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Unable to log in."
        });
    }
});

// ==================================
// GET: FETCH THIS TEACHER'S STUDENTS
// ==================================

app.get("/students", authenticateToken, async (req, res) => {
    try {
        const students = await Student.find({
            teacher: req.user.userId
        });

        return res.status(200).json(students);
    } catch (error) {
        console.error("Fetch error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch students."
        });
    }
});

// ==================================
// POST: ADD A STUDENT
// ==================================

app.post("/students", authenticateToken, async (req, res) => {
    try {
        const { name, age, course, email } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            age === undefined ||
            age === null ||
            age === "" ||
            typeof course !== "string" ||
            !course.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                message: "Name, age, course and email are required."
            });
        }

        const student = await Student.create({
            name: name.trim(),
            age,
            course: course.trim(),
            email: email.trim(),
            teacher: req.user.userId
        });

        return res.status(201).json(student);
    } catch (error) {
        console.error("Add error:", error.message);

        return res.status(400).json({
            message: error.message
        });
    }
});

// ==================================
// PUT: UPDATE THIS TEACHER'S STUDENT
// ==================================

app.put("/students/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid student ID."
            });
        }

        const { name, age, course, email } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            age === undefined ||
            age === null ||
            age === "" ||
            typeof course !== "string" ||
            !course.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                message: "Name, age, course and email are required."
            });
        }

        const student = await Student.findOneAndUpdate(
            {
                _id: id,
                teacher: req.user.userId
            },
            {
                name: name.trim(),
                age,
                course: course.trim(),
                email: email.trim()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found in your account."
            });
        }

        return res.status(200).json(student);
    } catch (error) {
        console.error("Update error:", error.message);

        return res.status(400).json({
            message: error.message
        });
    }
});

// ==================================
// DELETE: REMOVE THIS TEACHER'S STUDENT
// ==================================

app.delete("/students/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid student ID."
            });
        }

        const student = await Student.findOneAndDelete({
            _id: id,
            teacher: req.user.userId
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found in your account."
            });
        }

        return res.status(200).json({
            message: "Student deleted successfully.",
            student
        });
    } catch (error) {
        console.error("Delete error:", error.message);

        return res.status(500).json({
            message: "Failed to delete student."
        });
    }
});

// ==================================
// CONNECT TO MONGODB
// ==================================

async function startServer() {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error("MONGODB_URI is missing from environment variables.");
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from environment variables.");
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
