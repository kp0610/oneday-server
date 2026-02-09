const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');

const app = express();
const port = 3001;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middlewares
app.use(cors());
app.use(express.json()); // Global JSON body parser is the standard practice

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
const authRoutes = require('./routes/auth');
const diaryRoutes = require('./routes/diary');
const mealRoutes = require('./routes/meals');
const healthcareRoutes = require('./routes/healthcare');
const eventRoutes = require('./routes/events');
const todoRoutes = require('./routes/todos');
const stopwatchRoutes = require('./routes/stopwatch');
const foodRoutes = require('./routes/foods');
const templateRoutes = require('./routes/templates');

app.use('/api/auth', authRoutes);
app.use('/api/diaries', diaryRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/healthcare', healthcareRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/stopwatch', stopwatchRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/templates', templateRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        msg: 'Something broke on the server!',
        error: err.message,
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
