import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch user borrow tickets
export const fetchUserBorrowTickets = createAsyncThunk(
  'borrowTickets/fetchUserBorrowTickets',
  async (token, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/users/borrow-tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể tải danh sách phiếu mượn'
      );
    }
  }
);

// Return a borrow ticket
export const returnBorrowTicket = createAsyncThunk(
  'borrowTickets/returnBorrowTicket',
  async ({ borrowTicketId, token }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/api/users/borrow-tickets/${borrowTicketId}/return`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể trả sách'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const borrowTicketsSlice = createSlice({
  name: 'borrowTickets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch borrow tickets
      .addCase(fetchUserBorrowTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBorrowTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserBorrowTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Đã có lỗi xảy ra';
      })
      // Return borrow ticket
      .addCase(returnBorrowTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(returnBorrowTicket.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(returnBorrowTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Đã có lỗi xảy ra';
      });
  },
});

export default borrowTicketsSlice.reducer; 