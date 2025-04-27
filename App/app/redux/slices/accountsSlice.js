import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAccounts',
  async (token, { rejectWithValue }) => {
    console.log('FETCH ACCOUNTS API CALL, TOKEN:', token);
    try {
      const response = await axios.get('http://localhost:3000/api/users/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log('FETCH ACCOUNTS RESPONSE:', response.data);
      return response.data.data;
    } catch (err) {
      console.log('FETCH ACCOUNTS ERROR:', err?.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    accounts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default accountsSlice.reducer;
