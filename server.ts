import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("scanbook.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT,
    author TEXT,
    cover_url TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    book_id TEXT,
    page_number INTEGER,
    content TEXT,
    highlight_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/books", (req, res) => {
    const books = db.prepare("SELECT * FROM books ORDER BY created_at DESC").all();
    res.json(books);
  });

  app.post("/api/books", (req, res) => {
    const { id, title, author, cover_url, file_path } = req.body;
    db.prepare("INSERT INTO books (id, title, author, cover_url, file_path) VALUES (?, ?, ?, ?, ?)")
      .run(id, title, author, cover_url, file_path);
    res.json({ success: true });
  });

  app.get("/api/books/:id/notes", (req, res) => {
    const notes = db.prepare("SELECT * FROM notes WHERE book_id = ? ORDER BY page_number ASC").all(req.params.id);
    res.json(notes);
  });

  app.post("/api/notes", (req, res) => {
    const { id, book_id, page_number, content, highlight_data } = req.body;
    db.prepare("INSERT INTO notes (id, book_id, page_number, content, highlight_data) VALUES (?, ?, ?, ?, ?)")
      .run(id, book_id, page_number, content, highlight_data);
    res.json({ success: true });
  });

  app.delete("/api/notes/:id", (req, res) => {
    db.prepare("DELETE FROM notes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
