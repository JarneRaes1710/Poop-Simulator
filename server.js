const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database
const db = new sqlite3.Database('./poop_tycoon.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Create Users Table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    plops REAL DEFAULT 0,
    pps INTEGER DEFAULT 0
)`);

// REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) return res.status(400).json({ error: "Username already exists" });
            res.json({ message: "Registration successful!", userId: this.lastID });
        });
    } catch {
        res.status(500).json({ error: "Server error" });
    }
});

// LOGIN ROUTE
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });
        
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });
        
        res.json({ 
            message: "Logged in!", 
            username: user.username,
            plops: user.plops,
            pps: user.pps
        });
    });
});

// SAVE GAME ROUTE
app.post('/api/save', (req, res) => {
    const { username, plops, pps } = req.body;
    db.run(`UPDATE users SET plops = ?, pps = ? WHERE username = ?`, [plops, pps, username], function(err) {
        if (err) return res.status(500).json({ error: "Failed to save progress" });
        res.json({ message: "Progress saved!" });
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));