import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Create registration thunk
export const createRegistration = createAsyncThunk(
  'registration/createRegistration',
  async ({ bookId, note, token }, { rejectWithValue }) => {
    try {
      console.log('Creating registration:', { bookId, note });
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const desiredBorrowDate = today.toISOString().split('T')[0];

      const response = await api.post(
        '/api/users/registrations',
        {
          book: bookId,
          desiredBorrowDate,
          note
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Get updated book info after registration
      const bookResponse = await api.get(`/api/users/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        registration: response.data.data,
        book: bookResponse.data.data
      };
    } catch (error) {
      console.log('Error creating registration:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể đăng ký mượn sách'
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

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    showRegistrationModal: (state) => {
      state.isModalVisible = true;
      state.error = null;
      state.success = false;
    },
    hideRegistrationModal: (state) => {
      state.isModalVisible = false;
      state.error = null;
    },
    resetRegistrationState: (state) => {
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.isModalVisible = false;
      })
      .addCase(createRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { showRegistrationModal, hideRegistrationModal, resetRegistrationState } = registrationSlice.actions;
export default registrationSlice.reducer; 