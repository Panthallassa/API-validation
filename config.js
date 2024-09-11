/** Common config for bookstore. */

let DB_URI;

if (process.env.NODE_ENV === "test") {
	DB_URI = "postgresql://localhost/books_test"; // Adjust with actual host and credentials
} else {
	DB_URI =
		process.env.DATABASE_URL ||
		"postgresql://localhost/books"; // Adjust with actual host and credentials
}

module.exports = { DB_URI };
