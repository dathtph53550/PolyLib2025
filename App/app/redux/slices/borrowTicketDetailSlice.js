import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Define the parameter type
/**
 * @typedef {Object} FetchBorrowTicketDetailParams
 * @property {string} borrowTicketId - The ID of the borrow ticket to fetch
 * @property {string} token - The authorization token
 */

// Thunk to fetch borrow ticket detail
/**
 * Fetch borrow ticket detail
 * @param {FetchBorrowTicketDetailParams} params - The parameters for the API call
 */
export const fetchBorrowTicketDetail = createAsyncThunk(
  'borrowTicketDetail/fetchBorrowTicketDetail',
  async ({ borrowTicketId, token }, { rejectWithValue }) => {
    try {
      console.log(`API Call to: /api/users/borrow-tickets/${borrowTicketId}`);
      
      // Add explicit configuration for better debugging
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('Request config:', config);
      
      const response = await api.get(`/api/users/borrow-tickets/${borrowTicketId}`, config);
      
      console.log('API Response status:', response.status);
      console.log('API Response data:', JSON.stringify(response.data).substring(0, 200) + '...');
      
      // Handle different possible response formats
      const ticketData = response.data.data || response.data;
      
      if (!ticketData) {
        throw new Error('No ticket data found in the response');
      }
      
      return ticketData;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error response:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch borrow ticket details'
      );
    }
  }
);

// Initial state
const initialState = {
  ticket: null,
  loading: false,
  error: null
};

// Slice
const borrowTicketDetailSlice = createSlice({
  name: 'borrowTicketDetail',
  initialState,
  reducers: {
    clearBorrowTicketDetail: (state) => {
      state.ticket = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBorrowTicketDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBorrowTicketDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.ticket = action.payload;
      })
      .addCase(fetchBorrowTicketDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch borrow ticket details';
      });
  }
});

export const { clearBorrowTicketDetail } = borrowTicketDetailSlice.actions;
export default borrowTicketDetailSlice.reducer; 