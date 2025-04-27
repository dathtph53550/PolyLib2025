import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunk to fetch all return tickets
export const fetchAllReturnTickets = createAsyncThunk(
  'returnTicketManager/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Calling API to fetch return tickets');
      const response = await api.get('http://localhost:3000/api/users/return-tickets');
      console.log('API response received:', response.data);
      
      // Make sure we return the correct data structure
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Found tickets in response.data.data, count:', response.data.data.length);
        return response.data;
      } else if (response.data && Array.isArray(response.data)) {
        console.log('Found tickets directly in response.data, count:', response.data.length);
        return { data: response.data };
      } else {
        console.log('Unexpected response format:', response.data);
        return { data: [] };
      }
    } catch (error) {
      console.error('Error fetching return tickets:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch return tickets'
      );
    }
  }
);

// Thunk to mark a fine as paid
export const markFineAsPaid = createAsyncThunk(
  'returnTicketManager/markPaid',
  async (returnTicketId, { rejectWithValue }) => {
    try {
      console.log('Marking fine as paid for ticket:', returnTicketId);
      const response = await api.put(`/api/users/return-tickets/${returnTicketId}/pay-fine`);
      console.log('Mark as paid response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking fine as paid:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark fine as paid'
      );
    }
  }
);

const initialState = {
  returnTickets: { data: [] },
  loading: false,
  error: null,
  processingTicket: false,
  processingError: null
};

const returnTicketManagerSlice = createSlice({
  name: 'returnTicketManager',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.processingError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handling fetchAllReturnTickets
      .addCase(fetchAllReturnTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReturnTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.returnTickets = action.payload;
        console.log('Updated state with return tickets:', action.payload);
      })
      .addCase(fetchAllReturnTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch return tickets:', action.payload);
      })
      
      // Handling markFineAsPaid
      .addCase(markFineAsPaid.pending, (state) => {
        state.processingTicket = true;
        state.processingError = null;
      })
      .addCase(markFineAsPaid.fulfilled, (state, action) => {
        state.processingTicket = false;
        // We don't update the tickets array here as we'll refetch the list
      })
      .addCase(markFineAsPaid.rejected, (state, action) => {
        state.processingTicket = false;
        state.processingError = action.payload;
      });
  }
});

export const { clearErrors } = returnTicketManagerSlice.actions;
export default returnTicketManagerSlice.reducer; 