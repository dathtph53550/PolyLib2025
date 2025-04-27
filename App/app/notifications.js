import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './redux/slices/notificationsSlice';
import { useAuth } from './context/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import API from './services/api';

// Cấu hình dayjs để hiển thị thời gian tương đối
dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function NotificationsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const notificationsState = useSelector((state) => state.notifications) || { notifications: [], loading: false, error: null };
  const { notifications = [], loading = false, error = null } = notificationsState;
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user?.token) {
      loadNotifications();
    }
  }, [user?.token]);

  const loadNotifications = async () => {
    if (user?.token) {
      dispatch(fetchNotifications(user.token));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = () => {
    if (user?.token) {
      dispatch(markAllNotificationsAsRead(user.token));
    }
  };

  const handleDeleteNotification = (notificationId) => {
    deleteNotification(notificationId);
  };

  const deleteNotification = async (notificationId) => {
    if (!user?.token) return;

    try {
      setDeletingId(notificationId);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await API.delete(`http://localhost:3000/api/users/notifications/${notificationId}`, config);
      
      // Cập nhật lại danh sách thông báo
      loadNotifications();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa thông báo');
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllRead = () => {
    if (!user?.token) return;
    
    const readNotifications = notifications.filter(n => n.isRead);
    
    if (readNotifications.length === 0) {
      Alert.alert('Thông báo', 'Không có thông báo đã đọc để xóa');
      return;
    }
    
    deleteAllRead();
  };

  const deleteAllRead = async () => {
    if (!user?.token) return;
    
    try {
      setRefreshing(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await API.delete('http://localhost:3000/api/users/notifications/read', config);
      
      // Cập nhật lại danh sách thông báo
      loadNotifications();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa thông báo đã đọc');
      console.error('Error deleting read notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = (notification) => {
    // Nếu thông báo chưa đọc, đánh dấu là đã đọc
    if (!notification.isRead && user?.token) {
      dispatch(markNotificationAsRead({ 
        notificationId: notification._id, 
        token: user.token 
      }));
    }

    // Định hướng dựa vào loại thông báo
    navigateBasedOnNotificationType(notification);
  };

  const navigateBasedOnNotificationType = (notification) => {
    // Điều hướng dựa vào loại thông báo và relatedTo
    if (!notification.relatedTo) return;

    const { model, id } = notification.relatedTo;

    switch (notification.type) {
      case 'borrow_request':
        if (model === 'Registration') {
          router.push({
            pathname: '/borrow-ticket-detail',
            params: { id }
          });
        }
        break;
      case 'return_ticket':
        if (model === 'ReturnTicket') {
          router.push({
            pathname: '/borrow-ticket-detail',
            params: { id: notification.relatedTo.id }
          });
        }
        break;
      default:
        // Mặc định không làm gì
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'borrow_request':
        return 'document-text-outline';
      case 'return_ticket':
        return 'checkmark-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const formatRelativeTime = (dateString) => {
    return dayjs(dateString).fromNow();
  };

  const renderNotificationItem = ({ item }) => (
    <View style={[
      styles.notificationItem,
      !item.isRead && styles.unreadNotification
    ]}>
      <View style={styles.notificationContent}>
        {!item.isRead && (
          <View style={styles.unreadDot}>
            <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
          </View>
        )}
        
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.notificationBody}
          onPress={() => handleNotificationPress(item)}
        >
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formatRelativeTime(item.createdAt)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item._id)}
          disabled={deletingId === item._id}
        >
          {deletingId === item._id ? (
            <ActivityIndicator size="small" color="#e74c3c" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Thông báo',
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleDeleteAllRead}
                disabled={loading || refreshing}
              >
                <Ionicons name="trash-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleMarkAllAsRead}
                disabled={loading || refreshing}
              >
                <Ionicons name="checkmark-done-outline" size={22} color="#3498db" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadNotifications}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3498db']}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  notificationsList: {
    padding: 0,
    paddingTop: 0,
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadNotification: {
    borderLeftColor: '#3498db',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  unreadDot: {
    marginRight: 10,
  },
  notificationBody: {
    flex: 1,
    paddingRight: 10,
  },
  notificationTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#666',
    fontSize: 13,
    marginBottom: 4,
  },
  notificationTime: {
    color: '#999',
    fontSize: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 