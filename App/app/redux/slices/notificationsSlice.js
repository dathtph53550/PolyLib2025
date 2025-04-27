import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Thunk để lấy danh sách thông báo
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (token, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await API.get('http://localhost:3000/api/users/notifications', config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể lấy thông báo');
    }
  }
);

// Thunk để đánh dấu thông báo đã đọc
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId, token }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await API.patch(
        `http://localhost:3000/api/users/notifications/${notificationId}/read`, 
        {}, 
        config
      );
      
      return { id: notificationId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể đánh dấu đã đọc');
    }
  }
);

// Thunk để đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (token, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await API.patch(
        'http://localhost:3000/api/users/notifications/read-all', 
        {}, 
        config
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Xử lý fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data || [];
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Đã xảy ra lỗi';
      })
      
      // Xử lý markNotificationAsRead
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Tìm và cập nhật thông báo đã đọc
        const index = state.notifications.findIndex(n => n._id === action.meta.arg.notificationId);
        if (index !== -1) {
          state.notifications[index].isRead = true;
          state.unreadCount = state.unreadCount > 0 ? state.unreadCount - 1 : 0;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể đánh dấu đã đọc';
      })
      
      // Xử lý markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.loading = false;
        
        // Đánh dấu tất cả thông báo là đã đọc
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể đánh dấu tất cả đã đọc';
      });
  }
});

export const { clearNotificationsError } = notificationsSlice.actions;
export default notificationsSlice.reducer; 