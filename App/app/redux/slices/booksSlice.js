import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../services/api';
import { createRegistration } from './registrationSlice';

const initialState = {
  books: [],
  loading: false,
  error: null,
};

export const addBook = createAsyncThunk(
  'books/addBook',
  async ({ title, category, author, publisher, rentalPrice, description, quantity, image, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:3000/api/users/books', {
        title,
        category, // ID
        author,
        publisher,
        rentalPrice,
        description,
        quantity,
        image,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:3000/api/users/books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteBook = createAsyncThunk(
  'books/deleteBook',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`http://localhost:3000/api/users/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async ({ id, book, token }, { rejectWithValue }) => {
    try {
      console.log('UPDATE BOOK - TOKEN:', token);
      console.log('UPDATE BOOK - PAYLOAD:', book);
      const response = await axios.put(`http://localhost:3000/api/users/books/${id}`, book, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      console.log('UPDATE BOOK ERROR:', err?.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.books = state.books.filter((book) => book._id !== action.payload);
      })
      .addCase(deleteBook.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addBook.fulfilled, (state, action) => {
        state.books.push(action.payload);
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        const idx = state.books.findIndex((b) => b._id === action.payload._id);
        if (idx !== -1) state.books[idx] = action.payload;
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createRegistration.fulfilled, (state, action) => {
        if (action.payload?.book) {
          const index = state.books.findIndex(book => book._id === action.payload.book._id);
          if (index !== -1) {
            state.books[index] = action.payload.book;
          }
        }
      });
  },
});

export default booksSlice.reducer;
