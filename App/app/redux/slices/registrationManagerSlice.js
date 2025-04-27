import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch all registrations
export const fetchAllRegistrations = createAsyncThunk(
  'registrationManager/fetchAll',
  async (token, { rejectWithValue }) => {
    try {
      console.log('Fetching all registrations');
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

// Update registration status
export const updateRegistrationStatus = createAsyncThunk(
  'registrationManager/updateStatus',
  async ({ registrationId, status, note, token }, { rejectWithValue }) => {
    try {
      console.log('Updating registration status:', { registrationId, status, note });
      const response = await api.put(
        `/api/users/registrations/${registrationId}/process`,
        { status, note },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.log('Error updating registration:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Không thể cập nhật trạng thái'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null
};

const registrationManagerSlice = createSlice({
  name: 'registrationManager',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all registrations
      .addCase(fetchAllRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRegistrations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update registration status
      .addCase(updateRegistrationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRegistrationStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateRegistrationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default registrationManagerSlice.reducer; 