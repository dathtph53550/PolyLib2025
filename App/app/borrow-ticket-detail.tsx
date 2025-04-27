import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from './context/AuthContext';
import { fetchBorrowTicketDetail, clearBorrowTicketDetail } from './redux/slices/borrowTicketDetailSlice';

interface BorrowTicketDetailProps {}

export default function BorrowTicketDetailScreen(props: BorrowTicketDetailProps) {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const { ticket, loading, error } = useSelector((state: any) => state.borrowTicketDetail);
  const { user } = useAuth();
  const [directApiTest, setDirectApiTest] = useState({ loading: false, success: false, error: null });
  
  // Test direct API call without Redux
  const testDirectApiCall = async () => {
    if (!id || !user?.token) return;
    
    setDirectApiTest({ loading: true, success: false, error: null });
    
    try {
      console.log(`Direct API test: Fetching borrow ticket ${id}`);
      
      const response = await fetch(`http://localhost:3000/api/users/borrow-tickets/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Direct API test: Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Direct API test: Response data received:', data);
      
      setDirectApiTest({ loading: false, success: true, error: null });
      Alert.alert('Direct API Test', 'API call succeeded! Check the console for details.');
    } catch (err: any) {
      console.error('Direct API test error:', err);
      setDirectApiTest({ loading: false, success: false, error: err.message });
      Alert.alert('Direct API Test Failed', `Error: ${err.message}`);
    }
  };
  
  useEffect(() => {
    console.log("BorrowTicketDetailScreen mounted with id:", id);
    console.log("User token:", user?.token ? "Available" : "Not available");
    
    if (id && user?.token) {
      console.log(`Fetching borrow ticket details for ID: ${id}`);
      dispatch(fetchBorrowTicketDetail({ borrowTicketId: id.toString(), token: user.token }) as any);
    }
    
    return () => {
      dispatch(clearBorrowTicketDetail());
    };
  }, [id, user?.token]);
  
  // Logging to check state
  useEffect(() => {
    console.log("Current state:", { loading, error, ticketAvailable: !!ticket });
    if (error) {
      console.log("Error details:", error);
    }
    if (ticket) {
      console.log("Ticket data received:", ticket);
    }
  }, [loading, error, ticket]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f1c40f';
      case 'approved':
        return '#2ecc71';
      case 'rejected':
        return '#e74c3c';
      case 'returned':
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
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add function to calculate days left
  const calculateDaysLeft = (dueDate: string) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Function to get color based on days left
  const getDaysLeftColor = (days: number | null) => {
    if (days === null) return '#666';
    if (days < 0) return '#e74c3c'; // Overdue
    if (days === 0) return '#e74c3c'; // Due today
    if (days <= 2) return '#e74c3c'; // Critical
    if (days <= 5) return '#f39c12'; // Warning
    return '#2ecc71'; // Safe
  };
  
  // Function to get days left message
  const getDaysLeftMessage = (days: number | null) => {
    if (days === null) return '';
    if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`;
    if (days === 0) return 'Đến hạn hôm nay';
    if (days === 1) return 'Còn 1 ngày';
    return `Còn ${days} ngày`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        
        {/* Add test buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (id && user?.token) {
                dispatch(fetchBorrowTicketDetail({ borrowTicketId: id.toString(), token: user.token }) as any);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.retryButton, { marginLeft: 10, backgroundColor: '#2ecc71' }]}
            onPress={testDirectApiCall}
            disabled={directApiTest.loading}
          >
            <Text style={styles.retryButtonText}>
              {directApiTest.loading ? 'Đang thử...' : 'Thử API trực tiếp'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {directApiTest.error && (
          <Text style={[styles.errorText, { marginTop: 10 }]}>
            Direct API error: {directApiTest.error}
          </Text>
        )}
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy thông tin phiếu mượn</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Phiếu Mượn</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
          <Text style={styles.statusText}>{getStatusText(ticket.status)}</Text>
        </View>

        {/* Book Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin sách</Text>
          <View style={styles.bookInfoContainer}>
            <Image 
              source={{ uri: ticket.book?.image }} 
              style={styles.bookImage}
              defaultSource={require('../assets/images/react-logo.png')}
            />
            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle}>{ticket.book?.title}</Text>
              <Text style={styles.bookAuthor}>Tác giả: {ticket.book?.author}</Text>
              {ticket.book?.rentalPrice && (
                <Text style={styles.rentalPrice}>
                  Giá thuê: {ticket.book.rentalPrice.toLocaleString()}đ
                </Text>
              )}
              {ticket.book?.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{ticket.book.category.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Borrow Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin mượn</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã phiếu mượn:</Text>
            <Text style={styles.infoValue}>{ticket._id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày mượn:</Text>
            <Text style={styles.infoValue}>{formatDate(ticket.borrowDate)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hạn trả:</Text>
            <View style={styles.dueDateContainer}>
              <Text style={[
                styles.infoValue, 
                isOverdue(ticket.dueDate) && styles.overdueText
              ]}>
                {formatDate(ticket.dueDate)}
                {isOverdue(ticket.dueDate) && " (Quá hạn)"}
              </Text>
              
              {ticket.status === 'approved' && (
                <View style={[
                  styles.daysLeftBadge, 
                  { backgroundColor: getDaysLeftColor(calculateDaysLeft(ticket.dueDate)) }
                ]}>
                  <Text style={styles.daysLeftText}>
                    {getDaysLeftMessage(calculateDaysLeft(ticket.dueDate))}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Due date warning message */}
          {ticket.status === 'approved' && (
            <View style={[
              styles.dueWarning,
              { backgroundColor: 
                isOverdue(ticket.dueDate) 
                  ? '#ffebee' 
                  : calculateDaysLeft(ticket.dueDate) <= 2 
                    ? '#fff3e0' 
                    : 'transparent' 
              },
              { borderLeftColor: getDaysLeftColor(calculateDaysLeft(ticket.dueDate)) }
            ]}>
              <Ionicons 
                name={isOverdue(ticket.dueDate) ? "alert-circle" : "time-outline"} 
                size={18} 
                color={getDaysLeftColor(calculateDaysLeft(ticket.dueDate))} 
              />
              <Text style={[styles.dueWarningText, { color: getDaysLeftColor(calculateDaysLeft(ticket.dueDate)) }]}>
                {isOverdue(ticket.dueDate) 
                  ? "Phiếu mượn này đã quá hạn. Vui lòng trả sách ngay để tránh phí phạt." 
                  : calculateDaysLeft(ticket.dueDate) <= 2 
                    ? "Sắp đến hạn trả. Vui lòng trả sách đúng hạn để tránh phí phạt."
                    : ""}
              </Text>
            </View>
          )}
          
          {ticket.status === 'returned' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày trả:</Text>
              <Text style={styles.infoValue}>{formatDate(ticket.returnedDate)}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo phiếu:</Text>
            <Text style={styles.infoValue}>{formatDate(ticket.createdAt)}</Text>
          </View>
        </View>

        {/* Notes Card */}
        {ticket.note && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ghi chú</Text>
            <Text style={styles.noteText}>{ticket.note}</Text>
          </View>
        )}

        {/* User Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin người mượn</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người mượn:</Text>
            <Text style={styles.infoValue}>{ticket.user?.fullname}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{ticket.user?.email}</Text>
          </View>
          
          {ticket.user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoValue}>{ticket.user.phone}</Text>
            </View>
          )}
        </View>

        {/* Admin Info Card */}
        {ticket.approvedBy && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin phê duyệt</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người duyệt:</Text>
              <Text style={styles.infoValue}>{ticket.approvedBy?.fullname}</Text>
            </View>
            
            {ticket.approvedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày duyệt:</Text>
                <Text style={styles.infoValue}>{formatDate(ticket.approvedAt)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Replace return button with information card */}
        {ticket.status === 'approved' && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="information-circle" size={24} color="#3498db" />
              <Text style={styles.infoCardTitle}>Hướng dẫn trả sách</Text>
            </View>
            <Text style={styles.infoCardText}>
              Để trả sách, vui lòng mang sách tới thư viện trong giờ làm việc. 
              Nhân viên thư viện sẽ kiểm tra tình trạng sách và hoàn tất quy trình trả sách cho bạn.
            </Text>
            {isOverdue(ticket.dueDate) && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#e74c3c" />
                <Text style={styles.warningText}>
                  Phiếu mượn này đã quá hạn. Có thể phát sinh phí phạt khi trả sách.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1B2E',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1B2E',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  bookInfoContainer: {
    flexDirection: 'row',
  },
  bookImage: {
    width: 100,
    height: 140,
    borderRadius: 8,
    marginRight: 16,
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1B2E',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rentalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B4EFF',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#F3F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#6B4EFF',
    fontSize: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1A1B2E',
  },
  overdueText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4EFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  returnButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dueDateContainer: {
    flex: 1,
  },
  daysLeftBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 5,
  },
  daysLeftText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8, 
    borderLeftWidth: 4,
  },
  dueWarningText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 8,
    flex: 1,
  },
}); 