import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserRegistrations, cancelRegistration } from '../redux/slices/registrationsSlice';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AppDispatch, RootState } from '../redux/store/store';

interface Registration {
  _id: string;
  book: {
    _id: string;
    title: string;
    author: string;
    image: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  desiredBorrowDate: string;
  note?: string;
  createdAt: string;
}

export default function RegistrationsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: registrations, loading, error } = useSelector((state: RootState) => state.registrations);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.token) {
      loadRegistrations();
    }
  }, [user?.token]);

  const loadRegistrations = () => {
    if (user?.token) {
      dispatch(fetchUserRegistrations(user.token));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRegistrations();
    setRefreshing(false);
  };

  const handleCancel = (registrationId: string) => {
    if (!user?.token) return;

    Alert.alert(
      "Hủy đăng ký",
      "Bạn có chắc muốn hủy đăng ký mượn sách này?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Có",
          onPress: () => {
            dispatch(cancelRegistration({ 
              registrationId, 
              note: 'Người dùng tự hủy đăng ký',
              token: user.token 
            }));
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  const renderItem = ({ item }: { item: Registration }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookTitle}>{item.book.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.authorText}>Tác giả: {item.book.author}</Text>
        <Text style={styles.dateText}>
          Ngày mong muốn: {new Date(item.desiredBorrowDate).toLocaleDateString('vi-VN')}
        </Text>
        {item.note && <Text style={styles.noteText}>Ghi chú: {item.note}</Text>}
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item._id)}
        >
          <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
          <Text style={styles.cancelButtonText}>Hủy đăng ký</Text>
        </TouchableOpacity>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phiếu Đăng Ký</Text>
      </View>
      <FlatList
        data={registrations}
        renderItem={renderItem}
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
              {error ? `Lỗi: ${error}` : 'Bạn chưa có đăng ký mượn sách nào'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
  authorText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    gap: 4,
  },
  cancelButtonText: {
    color: '#e74c3c',
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