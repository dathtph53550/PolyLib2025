import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ListRenderItem
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchAllRegistrations, updateRegistrationStatus } from '../redux/slices/registrationManagerSlice';
import type { RootState, AppDispatch } from '../redux/store/store';

// Add typed dispatch hook
const useAppDispatch = () => useDispatch<AppDispatch>();

interface Book {
  _id: string;
  title: string;
  author: string;
  image: string;
}

interface User {
  _id: string;
  fullname: string;
  email: string;
}

interface Registration {
  _id: string;
  book: Book;
  user: User;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  desiredBorrowDate: string;
  note?: string;
  createdAt: string;
}

interface StatusFilter {
  label: string;
  value: string;
}

const STATUS_FILTERS: StatusFilter[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Từ chối', value: 'rejected' },
  { label: 'Đã hủy', value: 'cancelled' }
];

export default function RegistrationManagerScreen() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useSelector((state: RootState) => state.registrationManager);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.token) {
      loadRegistrations();
    }
  }, [user?.token]);

  const loadRegistrations = async () => {
    if (user?.token) {
      await dispatch(fetchAllRegistrations(user.token));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRegistrations();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (registrationId: string, newStatus: 'approved' | 'rejected') => {
    if (!user?.token) return;

    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn ${newStatus === 'approved' ? 'duyệt' : 'từ chối'} phiếu đăng ký này?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            Alert.prompt(
              "Ghi chú",
              "Nhập ghi chú (không bắt buộc):",
              [
                {
                  text: "Hủy",
                  style: "cancel"
                },
                {
                  text: "OK",
                  onPress: async (note?: string) => {
                    await dispatch(updateRegistrationStatus({
                      registrationId,
                      status: newStatus,
                      note: note || undefined,
                      token: user.token
                    }));
                  }
                }
              ],
              "plain-text"
            );
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#f1c40f';
      case 'approved':
        return '#2ecc71';
      case 'rejected':
        return '#e74c3c';
      case 'cancelled':
        return '#95a5a6';
      default:
        return '#bdc3c7';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const filteredItems = items.filter((item: Registration) => 
    activeFilter === 'all' ? true : item.status === activeFilter
  );

  const renderItem: ListRenderItem<Registration> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookTitle}>{item?.book?.title || 'Không có tiêu đề'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.infoText}>Người mượn: {item?.user?.fullname || 'Không xác định'}</Text>
        <Text style={styles.infoText}>Email: {item?.user?.email || 'Không xác định'}</Text>
        <Text style={styles.infoText}>
          Ngày đăng ký: {item?.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Không xác định'}
        </Text>
        <Text style={styles.infoText}>
          Ngày mong muốn: {item?.desiredBorrowDate ? new Date(item.desiredBorrowDate).toLocaleDateString('vi-VN') : 'Không xác định'}
        </Text>
        {item?.note && <Text style={styles.noteText}>Ghi chú: {item.note}</Text>}
      </View>

      {item?.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleUpdateStatus(item._id, 'approved')}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Duyệt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleUpdateStatus(item._id, 'rejected')}
          >
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.value && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === item.value && styles.filterButtonTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6B4EFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {error ? `Lỗi: ${error}` : 'Không có phiếu đăng ký nào'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#6B4EFF',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 