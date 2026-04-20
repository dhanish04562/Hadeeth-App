const booksService = require("./books.service");

async function listBooks(req, res) {
  const books = await booksService.listBooks(req.query);
  res.json(books);
}

async function getBook(req, res) {
  const book = await booksService.getBookById(req.params.id);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json(book);
}

async function createBook(req, res) {
  const book = await booksService.createBook(req.body);
  res.status(201).json(book);
}

async function updateBook(req, res) {
  const book = await booksService.updateBook(req.params.id, req.body);

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json(book);
}

async function deleteBook(req, res) {
  const removed = await booksService.deleteBook(req.params.id);

  if (!removed) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(204).send();
}

module.exports = {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook
};
