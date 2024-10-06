import { Router } from 'express';
import axios from 'axios';
import pool from '../db.js';

const router = Router();
const ITEMS_PER_PAGE = 5;

// Helper function to fetch the book cover
async function getBookCover(isbn) {
  if (!isbn) {
    console.log('No ISBN provided');
    return '/images/default-cover.jpg';
  }

  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  
  try {
    const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
    const response = await axios.get(openLibraryUrl);
    
    if (response.data[`ISBN:${cleanIsbn}`]?.cover?.large) {
      return response.data[`ISBN:${cleanIsbn}`].cover.large;
    }
    
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
    await axios.head(coverUrl);
    
    return coverUrl;
  } catch (error) {
    console.error(`Error fetching cover for ISBN ${isbn}:`, error.message);
    return '/images/default-cover.jpg';
  }
}

// Search books
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    let result;
    
    if (query) {
      result = await pool.query(
        `SELECT * FROM books 
         WHERE LOWER(title) LIKE LOWER($1) 
         OR LOWER(author) LIKE LOWER($1) 
         OR LOWER(review) LIKE LOWER($1)
         ORDER BY date_read DESC`,
        [`%${query}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM books ORDER BY date_read DESC');
    }
    
    const booksWithCovers = await Promise.all(result.rows.map(async (book) => {
      const cover = await getBookCover(book.isbn);
      return { ...book, cover };
    }));

    // Get total count for pagination if needed
    const totalCountResult = await pool.query('SELECT COUNT(*) FROM books');
    const totalBooks = parseInt(totalCountResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / ITEMS_PER_PAGE);
    
    res.render('books', { 
      books: booksWithCovers,
      searchQuery: query,
      currentPage: 1,
      totalPages,
      hasNextPage: false,
      hasPreviousPage: false
    });
  } catch (err) {
    console.error('Error searching books:', err.message);
    res.status(500).render('error', { message: 'Error searching books' });
  }
});

// Get all books with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * ITEMS_PER_PAGE;
    
    const totalCountResult = await pool.query('SELECT COUNT(*) FROM books');
    const totalBooks = parseInt(totalCountResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / ITEMS_PER_PAGE);

    const result = await pool.query(
      'SELECT * FROM books ORDER BY date_read DESC LIMIT $1 OFFSET $2',
      [ITEMS_PER_PAGE, offset]
    );
    
    const booksWithCovers = await Promise.all(result.rows.map(async (book) => {
      const cover = await getBookCover(book.isbn);
      return { ...book, cover };
    }));
    
    res.render('books', { 
      books: booksWithCovers,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1
    });
  } catch (err) {
    console.error('Error fetching books:', err.message);
    res.status(500).render('error', { message: 'Failed to fetch books' });
  }
});

// Add a new book
router.post('/add', async (req, res) => {
  const { title, author, isbn, rating, date_read, review } = req.body;

  try {
    const cover = await getBookCover(isbn);
    
    await pool.query(
      'INSERT INTO books (title, author, isbn, rating, date_read, review, cover) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [title, author, isbn, rating, date_read, review, cover]
    );
    res.redirect('/books');
  } catch (err) {
    console.error('Error adding book:', err.message);
    res.status(500).render('error', { message: 'Failed to add book' });
  }
});

// View a single book
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).render('error', { message: 'Book not found' });
    }
    
    const book = result.rows[0];
    const cover = await getBookCover(book.isbn);
    
    res.render('view-book', { book: { ...book, cover } });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server Error' });
  }
});

// Show edit form for a book
router.get('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).render('error', { message: 'Book not found' });
    }
    
    res.render('edit-book', { book: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Server Error' });
  }
});

// Update a book
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, rating, date_read, review } = req.body;

  try {
    const cover = await getBookCover(isbn);
    
    await pool.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3, rating = $4, date_read = $5, review = $6, cover = $7 WHERE id = $8',
      [title, author, isbn, rating, date_read, review, cover, id]
    );
    res.redirect(`/books/${id}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Failed to update book' });
  }
});

// Delete a book
router.post('/:id/delete', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.redirect('/books');
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { message: 'Failed to delete book' });
  }
});

export default router;