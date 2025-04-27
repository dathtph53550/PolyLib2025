import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunk to fetch all borrow tickets with optional status filter
export const fetchAllBorrowTickets = createAsyncThunk(
  'borrowTicketManager/fetchAll',
  async (status = '', { rejectWithValue }) => {
    try {
      // Construct query string with status if provided
      const queryString = status ? `?status=${status}` : '';
      const response = await api.get(`/api/users/borrow-tickets${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch borrow tickets'
      );
    }
  }
);

// Thunk to process a borrow ticket (approve, reject, or mark as returned)
export const processBorrowTicket = createAsyncThunk(
  'borrowTicketManager/process',
  async ({ ticketId, action, fine = 0 }, { rejectWithValue }) => {
    try {
      let endpoint;
      let requestData = {};
      
      // Determine the correct endpoint and data based on the action
      if (action === 'approve') {
        endpoint = `/api/users/borrow-tickets/${ticketId}/approve`;
      } else if (action === 'reject') {
        endpoint = `/api/users/borrow-tickets/${ticketId}/reject`;
      } else if (action === 'return') {
        endpoint = `/api/users/borrow-tickets/${ticketId}/return`;
        requestData = { fine };
      } else {
        throw new Error('Invalid action');
      }
      
      const response = await api.put(endpoint, requestData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || `Failed to ${action} borrow ticket`
      );
    }
  }
);

const initialState = {
  tickets: [],
  loading: false,
  error: null,
  statusFilter: '', // '' for all, 'pending', 'borrowed', 'returned', 'cancelled'
  processingTicket: false,
  processingError: null
};

const borrowTicketManagerSlice = createSlice({
  name: 'borrowTicketManager',
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
      state.processingError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handling fetchAllBorrowTickets
      .addCase(fetchAllBorrowTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBorrowTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchAllBorrowTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Handling processBorrowTicket
      .addCase(processBorrowTicket.pending, (state) => {
        state.processingTicket = true;
        state.processingError = null;
      })
      .addCase(processBorrowTicket.fulfilled, (state, action) => {
        state.processingTicket = false;
        // We don't update the tickets array here as we'll refetch the list
      })
      .addCase(processBorrowTicket.rejected, (state, action) => {
        state.processingTicket = false;
        state.processingError = action.payload;
      });
  }
});

export const { setStatusFilter, clearErrors } = borrowTicketManagerSlice.actions;
export default borrowTicketManagerSlice.reducer; 