// index.js
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool from './db.js';
import bookRoutes from './routes/books.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.use('/books', bookRoutes);

// Home Route
app.get('/', (req, res) => {
  res.redirect('/books');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
