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
  SafeAreaView,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBorrowTickets } from '../redux/slices/borrowTicketsSlice';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

interface Book {
  _id: string;
  title: string;
  author: string;
  image: string;
  rentalPrice?: number;
}

interface BorrowTicket {
  _id: string;
  book: Book;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  borrowDate: string;
  dueDate: string;
  note?: string;
  createdAt: string;
}

export default function BorrowTicketsScreen() {
  const dispatch = useDispatch();
  const { items: borrowTickets, loading, error } = useSelector((state: any) => state.borrowTickets);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approved' | 'returned'>('approved');

  useEffect(() => {
    if (user?.token) {
      loadBorrowTickets();
    }
  }, [user?.token]);

  const loadBorrowTickets = () => {
    if (user?.token) {
      dispatch(fetchUserBorrowTickets(user.token) as any);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBorrowTickets();
    setRefreshing(false);
  };
  
  const navigateToBookDetail = (book: Book) => {
    router.push({
      pathname: '/book-detail',
      params: { 
        id: book._id,
        title: book.title,
        author: book.author,
        image: book.image,
        rentalPrice: book.rentalPrice?.toString() || '0'
      }
    });
  };
  
  const navigateToBorrowTicketDetail = (borrowTicketId: string) => {
    router.push({
      pathname: '/borrow-ticket-detail',
      params: { id: borrowTicketId }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f1c40f';
      case 'approved':
        return '#2ecc71';
      case 'rejected':
        return '#e74c3c';
      case 'returned':
        return '#4CD964'; // Màu xanh lá đậm hơn cho trạng thái "Đã trả"
      default:
        return '#bdc3c7';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đang mượn';
      case 'rejected':
        return 'Từ chối';
      case 'returned':
        return 'Đã trả';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return today > due;
  };
  
  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const getDueDateStyle = (dueDate: string) => {
    const daysLeft = getDaysLeft(dueDate);
    
    if (daysLeft < 0) return styles.overdueBorder; // Past due
    if (daysLeft <= 2) return styles.urgentBorder; // Urgent (0-2 days)
    if (daysLeft <= 5) return styles.warningBorder; // Warning (3-5 days)
    return styles.normalBorder; // Normal
  };
  
  const getDueDateColor = (dueDate: string) => {
    const daysLeft = getDaysLeft(dueDate);
    
    if (daysLeft < 0) return '#e74c3c'; // Red for overdue
    if (daysLeft === 0) return '#e74c3c'; // Red for today
    if (daysLeft === 1) return '#e74c3c'; // Red for tomorrow
    if (daysLeft <= 5) return '#f39c12'; // Orange for warning
    return '#2ecc71'; // Green for normal
  };

  // Lọc phiếu mượn dựa vào tab đang chọn
  const filteredBorrowTickets = borrowTickets.filter((ticket: BorrowTicket) => {
    if (activeTab === 'approved') {
      return ticket.status === 'approved' || ticket.status === 'pending';
    } else if (activeTab === 'returned') {
      return ticket.status === 'returned';
    }
    return false;
  });

  // Tính toán số lượng quá hạn
  const overdueCount = borrowTickets.filter(
    (ticket: BorrowTicket) => ticket.status === 'approved' && isOverdue(ticket.dueDate)
  ).length;

  // Tính toán số lượng sắp đến hạn (trong vòng 2 ngày)
  const upcomingDueCount = borrowTickets.filter(
    (ticket: BorrowTicket) => 
      ticket.status === 'approved' && 
      getDaysLeft(ticket.dueDate) >= 0 && 
      getDaysLeft(ticket.dueDate) <= 2
  ).length;

  const renderItem = ({ item }: { item: BorrowTicket }) => (
    <TouchableOpacity
      style={[
        styles.card, 
        item.status === 'approved' && getDueDateStyle(item.dueDate),
        item.status === 'returned' && styles.returnedCard
      ]}
      onPress={() => navigateToBorrowTicketDetail(item._id)}
      activeOpacity={0.8}
    >
      <View style={styles.statusRibbon}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.book.image }} 
          style={styles.bookImage}
          defaultSource={require('../../assets/images/react-logo.png')}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.bookTitle}>{item.book.title}</Text>
          <Text style={styles.authorText}>Tác giả: {item.book.author}</Text>
          {item.book.rentalPrice !== undefined && (
            <Text style={styles.rentalPrice}>
              Giá thuê: {item.book.rentalPrice.toLocaleString()}đ
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateText}>
            Ngày mượn: {new Date(item.borrowDate).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        
        <View style={[
          styles.dueDateContainer, 
          { borderLeftColor: getDueDateColor(item.dueDate) }
        ]}>
          <View style={styles.infoRow}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={getDueDateColor(item.dueDate)} 
            />
            <Text style={[
              styles.dateText, 
              { color: getDueDateColor(item.dueDate), fontWeight: '600' }
            ]}>
              Hạn trả: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
              {isOverdue(item.dueDate) && item.status !== 'returned' && " (Quá hạn)"}
            </Text>
          </View>
          
          {item.status === 'approved' && !isOverdue(item.dueDate) && (
            <View style={[
              styles.daysLeftBadge, 
              { backgroundColor: getDueDateColor(item.dueDate) }
            ]}>
              <Text style={styles.daysLeftText}>
                {getDaysLeft(item.dueDate) === 0 
                  ? "Hôm nay" 
                  : getDaysLeft(item.dueDate) === 1
                    ? "Còn 1 ngày"
                    : `Còn ${getDaysLeft(item.dueDate)} ngày`}
              </Text>
            </View>
          )}
          
          {isOverdue(item.dueDate) && item.status === 'approved' && (
            <View style={styles.overdueBadge}>
              <Text style={styles.daysLeftText}>Quá hạn</Text>
            </View>
          )}
        </View>
        
        {item.note && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.noteText}>Ghi chú: {item.note}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.bookDetailRow}>
        <Text style={styles.viewDetailText}>
          Nhấn để xem chi tiết phiếu mượn <Ionicons name="chevron-forward-outline" size={14} color="#6B4EFF" />
        </Text>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Phiếu Mượn Sách</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'approved' && styles.activeTabButton]} 
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            Đang Mượn
            {overdueCount > 0 && (
              <Text style={styles.overdueCountBadge}> ({overdueCount})</Text>
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'returned' && styles.activeTabButton]} 
          onPress={() => setActiveTab('returned')}
        >
          <Text style={[styles.tabText, activeTab === 'returned' && styles.activeTabText]}>Đã Trả</Text>
        </TouchableOpacity>
      </View>
      
      {/* Warning Banner - chỉ hiển thị ở tab Đang Mượn */}
      {activeTab === 'approved' && upcomingDueCount > 0 && (
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle-outline" size={20} color="#fff" />
          <Text style={styles.warningText}>
            Bạn có {upcomingDueCount} sách sắp đến hạn trong 2 ngày tới
          </Text>
        </View>
      )}
      
      <FlatList
        data={filteredBorrowTickets}
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
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {error ? `Lỗi: ${error}` : activeTab === 'approved' ? 'Bạn chưa mượn sách nào' : 'Bạn chưa trả sách nào'}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#1A1B2E',
    textAlign: 'center',
  },
  // Tab Container Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#6B4EFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  overdueCountBadge: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative', // Để căn chỉnh statusRibbon
  },
  returnedCard: {
    backgroundColor: '#f0fff4', // Màu nền nhẹ cho phiếu đã trả
    borderLeftWidth: 4,
    borderLeftColor: '#4CD964',
  },
  statusRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 10, // Để tránh chồng lên statusRibbon
  },
  bookImage: {
    width: 70,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1B2E',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    borderBottomLeftRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  rentalPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B4EFF',
  },
  cardContent: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  overdueText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4EFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  returnButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  normalBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  warningBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  urgentBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  overdueBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    backgroundColor: '#ffebee',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  daysLeftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysLeftText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overdueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  warningText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'center',
  },
  bookDetailRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  viewDetailText: {
    fontSize: 12,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  todayBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 