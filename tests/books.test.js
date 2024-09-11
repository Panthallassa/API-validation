process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

let testBook;

beforeEach(async () => {
	await db.query("DELETE FROM books");
	// Insert a test book into the database for testing
	testBook = await Book.create({
		isbn: "1234567890123",
		title: "Test Book",
		author: "Jane Doe",
		year: 2023,
		publisher: "Test Publisher",
	});
});

afterEach(async () => {
	// Clean up after each test
	await db.query(
		"DELETE FROM books WHERE isbn = '1234567890123'"
	);
});

afterAll(async () => {
	// Close the database connection
	await db.end();
});

test("Book is inserted correctly", async () => {
	// Query the book that was just inserted
	const result = await db.query(
		"SELECT * FROM books WHERE isbn = '1234567890123'"
	);

	// Check that the result contains one row
	expect(result.rows.length).toEqual(1);

	// Check that the book data matches what was inserted
	const book = result.rows[0];
	expect(book.isbn).toEqual("1234567890123");
	expect(book.title).toEqual("Test Book");
	expect(book.author).toEqual("Jane Doe");
	expect(book.year).toEqual(2023);
	expect(book.publisher).toEqual("Test Publisher");
});

/** GET /books - get list of books */
describe("GET /books", () => {
	test("Gets a list of books", async () => {
		const res = await request(app).get("/books");
		expect(res.statusCode).toBe(200);
		expect(res.body.books.length).toBe(1); // Should return the inserted test book
		expect(res.body.books[0]).toHaveProperty("isbn");
	});
});

/** GET /books/[isbn] - get book by isbn */
describe("GET /books/:isbn", () => {
	test("Gets a book by isbn", async () => {
		const res = await request(app).get(
			`/books/${testBook.isbn}`
		);
		expect(res.statusCode).toBe(200);
		expect(res.body.book.isbn).toBe(testBook.isbn);
	});

	test("Responds with 404 if book not found", async () => {
		const res = await request(app).get(
			`/books/9999999999999`
		);
		expect(res.statusCode).toBe(404);
	});
});

/** POST /books - create a new book */
describe("POST /books", () => {
	test("Creates a new book", async () => {
		const newBook = {
			isbn: "9876543210123",
			title: "New Book",
			author: "John Smith",
			year: 2024,
			publisher: "New Publisher",
		};
		const res = await request(app)
			.post("/books")
			.send(newBook);
		expect(res.statusCode).toBe(201);
		expect(res.body.book).toHaveProperty("isbn");
		expect(res.body.book.title).toBe("New Book");
	});

	test("Fails to create a new book with invalid data", async () => {
		const invalidBook = {
			isbn: "invalid-isbn", // Invalid ISBN
			title: "Invalid Book",
			author: "John Smith",
			year: 2024,
		};
		const res = await request(app)
			.post("/books")
			.send(invalidBook);
		expect(res.statusCode).toBe(400); // Should return 400 for validation error
		expect(res.body.errors.length).toBeGreaterThan(0);
	});
});

/** PUT /books/[isbn] - update an existing book */
describe("PUT /books/:isbn", () => {
	test("Updates an existing book", async () => {
		const updatedData = {
			isbn: testBook.isbn,
			title: "Updated Book Title",
			author: "Jane Doe Updated",
			year: 2024,
			publisher: "Updated Publisher",
		};
		const res = await request(app)
			.put(`/books/${testBook.isbn}`)
			.send(updatedData);
		expect(res.statusCode).toBe(200);
		expect(res.body.book.title).toBe("Updated Book Title");
	});

	test("Fails to update a book with invalid data", async () => {
		const invalidUpdate = {
			isbn: "invalid-isbn", // Invalid ISBN
		};
		const res = await request(app)
			.put(`/books/${testBook.isbn}`)
			.send(invalidUpdate);
		expect(res.statusCode).toBe(400);
		expect(res.body.errors.length).toBeGreaterThan(0);
	});
});

/** DELETE /books/[isbn] - delete a book by isbn */
describe("DELETE /books/:isbn", () => {
	test("Deletes a book by isbn", async () => {
		const res = await request(app).delete(
			`/books/${testBook.isbn}`
		);
		expect(res.statusCode).toBe(200);
		expect(res.body.message).toBe("Book deleted");
	});

	test("Responds with 404 if book not found for deletion", async () => {
		const res = await request(app).delete(
			`/books/9999999999999`
		);
		expect(res.statusCode).toBe(404);
	});
});
