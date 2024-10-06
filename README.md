# My Book Notes

A web application to store notes, ratings, and reviews for books you've read.

## Features

- Add new books
- Search books by title, author, or review
- View book details
- Edit and delete books
- Pagination for book listings
- Fetch book covers from Open Library API based on ISBN

## Technologies Used

- Node.js
- Express
- PostgreSQL
- EJS (Embedded JavaScript)
- Axios (for making HTTP requests)
- HTML & CSS

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>

2. Install dependencies: npm install

3. Create a .env file for environment variables:
    DB_USER=<your-database-user>
    DB_HOST=localhost
    DB_NAME=<your-database-name>
    DB_PASSWORD=<your-database-password>
    DB_PORT=5432

4. Create the PostgreSQL database and tables:
    -- Connect to your PostgreSQL database and run the following SQL
    CREATE TABLE books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(13),
        rating INTEGER,
        date_read DATE,
        review TEXT,
        cover TEXT
    );

5. Run the application: npm start

## Usage
Visit http://localhost:3000/books in your browser to use the application.    
Use the search bar to find books.
Click "Add Book" to add a new book to your collection.
Click on any book to view more details or to edit or delete it.
API Integration
This application integrates with the Open Library API to fetch book covers based on ISBN numbers. It uses Axios for making HTTP requests to retrieve cover images.