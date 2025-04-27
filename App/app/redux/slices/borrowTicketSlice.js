import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Create borrow ticket
export const createBorrowTicket = createAsyncThunk(
  'borrowTicket/create',
  async ({ bookId, note, token }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        '/api/users/borrow-tickets',
        {
          book: bookId,
          note
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể tạo phiếu mượn'
      );
    }
  }
);

const initialState = {
  isModalVisible: false,
  loading: false,
  error: null,
  success: false
};

const borrowTicketSlice = createSlice({
  name: 'borrowTicket',
  initialState,
  reducers: {
    showBorrowModal: (state) => {
      state.isModalVisible = true;
      state.error = null;
      state.success = false;
    },
    hideBorrowModal: (state) => {
      state.isModalVisible = false;
      state.error = null;
    },
    resetBorrowState: (state) => {
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBorrowTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBorrowTicket.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.isModalVisible = false;
      })
      .addCase(createBorrowTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { showBorrowModal, hideBorrowModal, resetBorrowState } = borrowTicketSlice.actions;
export default borrowTicketSlice.reducer; 