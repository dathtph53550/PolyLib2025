import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllReturnTickets, markFineAsPaid } from '../redux/slices/returnTicketManagerSlice';
import API from '../services/api';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { useNavigation } from '@react-navigation/native';

interface Book {
  _id: string;
  title: string;
  author: string;
  image?: string;
  rentalPrice: number;
}

interface User {
  _id: string;
  fullName?: string;
  fullname?: string;
  email: string;
  username?: string;
}

interface ReturnInfo {
  _id: string;
  borrowTicket: string;
  returnDate: string;
  condition: string;
  fine?: {
    amount: number;
    reason: string;
    paid: boolean;
  };
  processedBy?: User;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface BorrowTicket {
  _id: string;
  book: Book;
  user: User;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  fine?: number;
  note?: string;
  approvedBy?: User;
  approvedAt?: string;
}

interface ReturnTicket extends ReturnInfo {
  borrowTicketDetails: BorrowTicket;
}

const ReturnTicketManagerScreen: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const { returnTickets, loading, error } = useSelector((state: any) => state.returnTicketManager);
  const [filteredTickets, setFilteredTickets] = useState<ReturnTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingDirectly, setLoadingDirectly] = useState<boolean>(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadReturnTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [searchQuery, returnTickets]);

  // Fallback direct API fetch if Redux doesn't work
  const loadReturnTicketsDirectly = async (): Promise<void> => {
    try {
      console.log('Attempting direct API fetch for return tickets');
      setLoadingDirectly(true);
      
      const response = await API.get('http://localhost:3000/api/users/return-tickets');
      console.log('Direct API response:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setFilteredTickets(response.data.data);
        console.log('Directly set filtered tickets from API, count:', response.data.data.length);
      } else {
        console.log('Direct API fetch returned unexpected format');
        setFilteredTickets([]);
      }
    } catch (error) {
      console.error('Error in direct API fetch:', error);
      setFilteredTickets([]);
    } finally {
      setLoadingDirectly(false);
    }
  };

  const loadReturnTickets = async (): Promise<void> => {
    console.log('Loading return tickets...');
    try {
      await dispatch(fetchAllReturnTickets());
      
      // Check if we have tickets after Redux fetch
      setTimeout(() => {
        if (filteredTickets.length === 0 && returnTickets?.data?.length === 0) {
          console.log('No tickets found via Redux, trying direct API fetch...');
          loadReturnTicketsDirectly();
        }
      }, 1000);
    } catch (error) {
      console.error('Error in Redux fetch, falling back to direct API:', error);
      loadReturnTicketsDirectly();
    }
  };

  const filterTickets = (): void => {
    console.log('Return tickets from Redux state:', returnTickets);
    
    // Check if returnTickets exists and has the correct structure
    if (!returnTickets) {
      console.log('No return tickets data available');
      setFilteredTickets([]);
      return;
    }
    
    // Handle both possible data structures
    let ticketsArray = [];
    if (returnTickets.data && Array.isArray(returnTickets.data)) {
      console.log('Found tickets in returnTickets.data array');
      ticketsArray = returnTickets.data;
    } else if (Array.isArray(returnTickets)) {
      console.log('Found tickets in returnTickets array directly');
      ticketsArray = returnTickets;
    } else {
      console.log('Unexpected data structure:', returnTickets);
      setFilteredTickets([]);
      return;
    }
    
    console.log('Number of tickets before filtering:', ticketsArray.length);
    
    const filtered = ticketsArray.filter((ticket: ReturnTicket) => {
      if (!ticket) return false;
      
      const query = searchQuery.toLowerCase();
      const bookTitle = ticket.borrowTicketDetails?.book?.title?.toLowerCase() || '';
      const userName = ticket.borrowTicketDetails?.user?.fullName?.toLowerCase() || '';
      const userEmail = ticket.borrowTicketDetails?.user?.email?.toLowerCase() || '';
      
      return (
        bookTitle.includes(query) ||
        userName.includes(query) ||
        userEmail.includes(query)
      );
    });
    
    console.log('Number of tickets after filtering:', filtered.length);
    setFilteredTickets(filtered);
  };

  const handleSearch = (text: string): void => {
    setSearchQuery(text);
  };

  const handleMarkAsPaid = async (returnTicket: ReturnTicket): Promise<void> => {
    if (!returnTicket.fine || returnTicket.fine.paid) return;
    
    try {
      await dispatch(markFineAsPaid(returnTicket._id as any));
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã cập nhật trạng thái thanh toán phí',
      });
      
      setTimeout(() => {
        loadReturnTickets();
      }, 500);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật trạng thái thanh toán',
      });
    }
  };

  const formatDate = (date: string): string => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  // Hàm để hiển thị tình trạng sách bằng tiếng Việt
  const getConditionText = (condition: string): string => {
    switch (condition) {
      case 'good':
        return 'Tốt';
      case 'damaged':
        return 'Hư hỏng';
      case 'lost':
        return 'Mất sách';
      default:
        return condition;
    }
  };

  const hasFine = (ticket: ReturnTicket): boolean => {
    return ticket.fine !== undefined && (ticket.fine?.amount || 0) > 0;
  };

  // Hàm tính tổng tiền (giá mượn + tiền phạt)
  const calculateTotalAmount = (ticket: ReturnTicket): number => {
    const rentalPrice = ticket.borrowTicketDetails?.book?.rentalPrice || 0;
    const fineAmount = ticket.fine?.amount || 0;
    return rentalPrice + fineAmount;
  };

  const renderReturnTicketItem = ({ item }: { item: ReturnTicket }) => {
    console.log('Rendering ticket item:', item);
    
    // Handle both data structures: item.borrowTicketDetails and item.borrowTicket
    const borrowTicket = item.borrowTicketDetails || item.borrowTicket;
    
    if (!borrowTicket) {
      console.log('No borrowTicket data for this item:', item._id);
      return (
        <View style={styles.ticketItem}>
          <View style={styles.ticketContent}>
            <Text style={styles.errorText}>Dữ liệu không đầy đủ</Text>
          </View>
        </View>
      );
    }
    
    // Tính tổng tiền
    const totalAmount = calculateTotalAmount(item);
    
    return (
      <View style={styles.ticketItem}>
        <View style={styles.ticketContent}>
          <View style={styles.ticketHeader}>
            <Text style={styles.bookTitle} numberOfLines={1}>{borrowTicket?.book?.title || 'Không tìm thấy'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Đã trả</Text>
            </View>
          </View>
          
          <View style={styles.ticketInfo}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Người mượn: </Text>
              <Text style={styles.infoValue}>{borrowTicket?.user?.fullName || borrowTicket?.user?.fullname || borrowTicket?.user?.username || 'Không tìm thấy'}</Text>
            </Text>
            
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Email: </Text>
              <Text style={styles.infoValue}>{borrowTicket?.user?.email || 'Không tìm thấy'}</Text>
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Ngày mượn: </Text>
                <Text style={styles.infoValue}>{formatDate(borrowTicket?.borrowDate || '')}</Text>
              </Text>
              
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Ngày trả: </Text>
                <Text style={styles.infoValue}>{formatDate(item.returnDate)}</Text>
              </Text>
            </View>
            
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Tình trạng: </Text>
              <Text style={[
                styles.infoValue, 
                item.condition === 'good' ? styles.goodCondition : 
                item.condition === 'damaged' ? styles.damagedCondition : 
                item.condition === 'lost' ? styles.lostCondition : null
              ]}>
                {getConditionText(item.condition)}
              </Text>
            </Text>
            
            {/* Hiển thị giá thuê sách */}
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Giá mượn: </Text>
              <Text style={styles.rentalPrice}>{borrowTicket?.book?.rentalPrice?.toLocaleString('vi-VN') || 0} VNĐ</Text>
            </Text>
            
            {hasFine(item) && (
              <View style={styles.fineContainer}>
                <Text style={styles.fineLabel}>
                  Tiền phạt: 
                  <Text style={styles.fineValue}> {item.fine?.amount.toLocaleString('vi-VN')} VNĐ</Text>
                </Text>
                {item.fine?.reason && (
                  <Text style={styles.fineReason}>Lý do: {item.fine.reason}</Text>
                )}
                {/* <View style={styles.finePaidStatus}>
                  <View style={[
                    styles.paidStatusBadge, 
                    item.fine?.paid ? styles.paidBadge : styles.unpaidBadge
                  ]}>
                    <Text style={[
                      styles.paidStatusText,
                      !item.fine?.paid && styles.unpaidBadgeText
                    ]}>
                      {item.fine?.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </Text>
                  </View>
                  
                  {!item.fine?.paid && (
                    <TouchableOpacity 
                      style={styles.markAsPaidButton}
                      onPress={() => handleMarkAsPaid(item)}
                    >
                      <Text style={styles.markAsPaidText}>Đánh dấu đã thu</Text>
                    </TouchableOpacity>
                  )}
                </View> */}
              </View>
            )}
            
            {/* Hiển thị tổng tiền */}
            
            
            {/* {item.note && (
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Ghi chú: </Text>
                <Text style={styles.noteText}>{item.note}</Text>
              </Text>
            )} */}
            
            {item.processedBy && (
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Xử lý bởi: </Text>
                <Text style={styles.infoValue}>
                  {item.processedBy.fullName || item.processedBy.fullname || item.processedBy.username || 'Không xác định'}
                </Text>
              </Text>
            )}

            <View style={styles.totalAmountContainer}>
                          <Text style={styles.totalAmountLabel}>Tổng tiền:</Text>
                          <Text style={styles.totalAmountValue}>
                            {(
                              (borrowTicket?.book?.rentalPrice || 0) + 
                              (item.fine?.amount || 0)
                            ).toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Method to navigate to stats screen
  const goToStatsScreen = () => {
    navigation.navigate('Thống Kê Doanh Thu' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản Lý Phiếu Trả</Text>
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={goToStatsScreen}
        >
          <Ionicons name="bar-chart-outline" size={20} color="#fff" />
          <Text style={styles.statsButtonText}>Thống kê</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên sách hoặc người mượn"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {(loading || loadingDirectly) ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.messageText}>Đang tải phiếu trả...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Lỗi: {typeof error === 'string' ? error : 'Đã xảy ra lỗi'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReturnTickets}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTickets.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.messageText}>Không tìm thấy phiếu trả nào</Text>
          
          <View style={styles.debugActions}>
            <TouchableOpacity 
              style={[styles.retryButton, {marginTop: 16, backgroundColor: '#007AFF'}]} 
              onPress={loadReturnTickets}
            >
              <Text style={styles.retryText}>Thử lại với Redux</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.retryButton, {marginTop: 8, backgroundColor: '#34C759'}]} 
              onPress={loadReturnTicketsDirectly}
            >
              <Text style={styles.retryText}>Tải trực tiếp từ API</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.retryButton, {marginTop: 8, backgroundColor: '#FF9500'}]} 
              onPress={() => {
                console.log('Redux state:', returnTickets);
                Toast.show({
                  type: 'info',
                  text1: 'Đã ghi log thông tin',
                  text2: 'Kiểm tra console để xem dữ liệu'
                });
              }}
            >
              <Text style={styles.retryText}>Hiển thị dữ liệu API trong log</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderReturnTicketItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.ticketList}
          refreshing={loading || loadingDirectly}
          onRefresh={loadReturnTickets}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  statsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
  },
  ticketList: {
    padding: 12,
  },
  ticketItem: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketContent: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#34C759',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketInfo: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    flexDirection: 'row',
  },
  infoLabel: {
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rentalPrice: {
    color: '#007AFF',
    fontWeight: '700',
  },
  goodCondition: {
    color: '#34C759',
  },
  damagedCondition: {
    color: '#FF9500',
  },
  lostCondition: {
    color: '#FF3B30',
  },
  fineContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  fineLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fineValue: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  fineReason: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 8,
  },
  finePaidStatus: {
    marginTop: 8,
  },
  paidStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  paidBadge: {
    backgroundColor: '#E6F7ED',
  },
  unpaidBadge: {
    backgroundColor: '#FFEBEC',
  },
  paidStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
  },
  unpaidBadgeText: {
    color: '#FF3B30',
  },
  markAsPaidButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  markAsPaidText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noteText: {
    color: '#333',
    fontStyle: 'italic',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '500',
  },
  debugActions: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  totalAmountContainer: {
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E1F9',
  },
  totalAmountLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
});

export default ReturnTicketManagerScreen; 