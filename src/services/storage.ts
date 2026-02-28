
export interface BookData {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  file_path: string;
  created_at: string;
}

export interface NoteData {
  id: string;
  book_id: string;
  page_number: number;
  content: string;
  highlight_data: string;
  created_at: string;
}

const STORAGE_KEY_BOOKS = 'scanbook_books';
const STORAGE_KEY_NOTES = 'scanbook_notes';

export const storage = {
  async getBooks(): Promise<BookData[]> {
    try {
      const res = await fetch('/api/books');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API unavailable, falling back to local storage');
    }
    
    const local = localStorage.getItem(STORAGE_KEY_BOOKS);
    return local ? JSON.parse(local) : [];
  },

  async saveBook(book: BookData): Promise<void> {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      });
      if (res.ok) return;
    } catch (e) {
      console.warn('API unavailable, saving to local storage');
    }

    const books = await this.getBooks();
    books.unshift(book);
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  },

  async getNotes(bookId: string): Promise<NoteData[]> {
    try {
      const res = await fetch(`/api/books/${bookId}/notes`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API unavailable, falling back to local storage');
    }

    const local = localStorage.getItem(STORAGE_KEY_NOTES);
    const allNotes: NoteData[] = local ? JSON.parse(local) : [];
    return allNotes.filter(n => n.book_id === bookId);
  },

  async saveNote(note: NoteData): Promise<void> {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      if (res.ok) return;
    } catch (e) {
      console.warn('API unavailable, saving to local storage');
    }

    const local = localStorage.getItem(STORAGE_KEY_NOTES);
    const allNotes: NoteData[] = local ? JSON.parse(local) : [];
    allNotes.push(note);
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(allNotes));
  },

  async deleteNote(noteId: string): Promise<void> {
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) return;
    } catch (e) {
      console.warn('API unavailable, deleting from local storage');
    }

    const local = localStorage.getItem(STORAGE_KEY_NOTES);
    const allNotes: NoteData[] = local ? JSON.parse(local) : [];
    const filtered = allNotes.filter(n => n.id !== noteId);
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(filtered));
  }
};
