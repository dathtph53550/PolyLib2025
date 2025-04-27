import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk để lấy danh mục
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (token, { rejectWithValue }) => {
    try {
      const res = await axios.get('http://localhost:3000/api/users/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data; // array category
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Lỗi lấy danh mục');
    }
  }
);

// Thêm danh mục
export const addCategory = createAsyncThunk(
  'categories/addCategory',
  async ({ name, image, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post('http://localhost:3000/api/users/categories', { name, image }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Lỗi thêm danh mục');
    }
  }
);

// Sửa danh mục
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, name, image, token }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`http://localhost:3000/api/users/categories/${id}`, { name, image }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Lỗi sửa danh mục');
    }
  }
);

// Xoá danh mục
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`http://localhost:3000/api/users/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Lỗi xoá danh mục');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ADD
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      // UPDATE
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.categories.findIndex(c => c._id === action.payload._id);
        if (idx > -1) state.categories[idx] = action.payload;
      })
      // DELETE
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c._id !== action.payload);
      });
  },
});

export default categoriesSlice.reducer;
