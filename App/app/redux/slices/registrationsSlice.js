import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch user registrations
export const fetchUserRegistrations = createAsyncThunk(
  'registrations/fetchUserRegistrations',
  async (token, { rejectWithValue }) => {
    try {
      console.log('Fetching registrations with token:', token);
      const response = await api.get('/api/users/registrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.log('Error fetching registrations:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể tải danh sách đăng ký'
      );
    }
  }
);

// Cancel registration
export const cancelRegistration = createAsyncThunk(
  'registrations/cancelRegistration',
  async ({ registrationId, note, token }, { rejectWithValue }) => {
    try {
      console.log('Cancelling registration:', { registrationId, token });
      const response = await api.put(
        `/api/users/registrations/${registrationId}/cancel`,
        { note },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.log('Error cancelling registration:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể hủy đăng ký'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch registrations
      .addCase(fetchUserRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRegistrations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Đã có lỗi xảy ra';
      })
      // Cancel registration
      .addCase(cancelRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelRegistration.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(cancelRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Đã có lỗi xảy ra';
      });
  },
});

export default registrationsSlice.reducer;