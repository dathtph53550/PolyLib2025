import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Cấu hình dayjs để sử dụng tiếng Việt
dayjs.locale('vi');

interface ReturnTicket {
  _id: string;
  borrowTicket?: {
    _id: string;
    user: {
      _id: string;
      name?: string;
      fullname?: string;
      email: string;
    };
    book: {
      _id: string;
      title: string;
      rentalPrice: number;
    };
    borrowDate: string;
    dueDate: string;
  };
  borrowTicketDetails?: {
    _id: string;
    user: {
      _id: string;
      name?: string;
      fullname?: string;
      email: string;
    };
    book: {
      _id: string;
      title: string;
      rentalPrice: number;
    };
    borrowDate: string;
    dueDate: string;
  };
  returnDate: string;
  condition: 'good' | 'damaged' | 'lost';
  fine?: {
    amount: number;
    reason: string;
    paid: boolean;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalReturns: number;
  totalRentalIncome: number;
  totalFines: number;
  totalPaidFines: number;
  totalUnpaidFines: number;
  totalRevenue: number;
  totalBooks: number;
  returnsByCondition: {
    good: number;
    damaged: number;
    lost: number;
  };
  finesByReason: Record<string, number>;
}

export default function ReturnTicketStatsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [returnTickets, setReturnTickets] = useState<ReturnTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ReturnTicket[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [stats, setStats] = useState<Stats>({
    totalReturns: 0,
    totalRentalIncome: 0,
    totalFines: 0,
    totalPaidFines: 0,
    totalUnpaidFines: 0,
    totalRevenue: 0,
    totalBooks: 0,
    returnsByCondition: {
      good: 0,
      damaged: 0,
      lost: 0
    },
    finesByReason: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, fetching return tickets...');
      fetchReturnTickets();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Fetch return tickets when component mounts
  useEffect(() => {
    fetchReturnTickets();
  }, []);

  // Filter tickets when timeFilter or returnTickets change
  useEffect(() => {
    console.log('Re-filtering tickets due to change in filter or tickets data');
    if (returnTickets.length > 0) {
      filterTicketsByTime();
    }
  }, [timeFilter, returnTickets]);

  // Calculate statistics when filteredTickets change
  useEffect(() => {
    console.log('Recalculating statistics based on filtered tickets');
    calculateStats();
  }, [filteredTickets]);

  const fetchReturnTickets = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!user?.token) {
        console.error('No auth token available');
        setError('Authentication required. Please login again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching return tickets...');
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Using the API service for consistency
      const response = await API.get('http://localhost:3000/api/users/return-tickets', config);
      console.log('Return tickets API response:', response.data);
      
      let tickets: ReturnTicket[] = [];
      
      // Handle different data structures that might be returned
      if (Array.isArray(response.data)) {
        tickets = response.data;
      } else if (response.data.returnTickets && Array.isArray(response.data.returnTickets)) {
        tickets = response.data.returnTickets;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        tickets = response.data.data;
      }
      
      console.log(`Loaded ${tickets.length} return tickets`);
      
      // Sort tickets by date (newest first)
      tickets.sort((a, b) => {
        return new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime();
      });
      
      setReturnTickets(tickets);
      setFilteredTickets(tickets); // Initialize filtered tickets with all tickets
    } catch (error: any) {
      console.error('Error fetching return tickets:', error);
      setError(error.message || 'Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReturnTickets();
    setRefreshing(false);
  };

  const filterTicketsByTime = () => {
    const now = dayjs();
    let filtered = [...returnTickets];
    
    console.log(`Filtering tickets by time: ${timeFilter}`);
    console.log(`Current date: ${now.format('YYYY-MM-DD')}`);
    console.log(`Total tickets before filtering: ${returnTickets.length}`);

    switch (timeFilter) {
      case 'today':
        filtered = returnTickets.filter(ticket => {
          // Get the return date and ensure proper date formatting
          const ticketDate = dayjs(ticket.returnDate);
          
          // Compare year, month, and day individually for more reliable comparison
          const isSameDay = 
            ticketDate.year() === now.year() && 
            ticketDate.month() === now.month() && 
            ticketDate.date() === now.date();
          
          console.log(`Ticket ${ticket._id} date: ${ticketDate.format('YYYY-MM-DD')}, Is today: ${isSameDay}`);
          return isSameDay;
        });
        break;
      case 'week':
        filtered = returnTickets.filter(ticket => 
          dayjs(ticket.returnDate).isAfter(now.subtract(7, 'day'))
        );
        break;
      case 'month':
        filtered = returnTickets.filter(ticket => 
          dayjs(ticket.returnDate).isAfter(now.subtract(30, 'day'))
        );
        break;
      case 'all':
      default:
        // Không cần lọc
        break;
    }

    console.log(`Filtered tickets count: ${filtered.length}`);
    setFilteredTickets(filtered);
  };

  const calculateStats = () => {
    const newStats: Stats = {
      totalReturns: filteredTickets.length,
      totalRentalIncome: 0,
      totalFines: 0,
      totalPaidFines: 0,
      totalUnpaidFines: 0,
      totalRevenue: 0,
      totalBooks: 0,
      returnsByCondition: {
        good: 0,
        damaged: 0,
        lost: 0
      },
      finesByReason: {}
    };

    filteredTickets.forEach(ticket => {
      // Lấy thông tin phiếu mượn từ một trong hai cấu trúc dữ liệu có thể có
      const borrowTicket = ticket.borrowTicket || ticket.borrowTicketDetails;
      
      if (!borrowTicket || !borrowTicket.book) {
        console.warn('Cấu trúc dữ liệu phiếu không hợp lệ:', ticket);
        return;
      }
      
      // Tính tổng tiền thuê
      newStats.totalRentalIncome += borrowTicket.book.rentalPrice || 0;

      // Tính thống kê theo tình trạng sách
      if (ticket.condition) {
        newStats.returnsByCondition[ticket.condition]++;
      }

      // Tính tiền phạt
      if (ticket.fine) {
        const fineAmount = ticket.fine.amount || 0;
        newStats.totalFines += fineAmount;

        // Phân loại tiền phạt đã thanh toán và chưa thanh toán
        if (ticket.fine.paid) {
          newStats.totalPaidFines += fineAmount;
        } else {
          newStats.totalUnpaidFines += fineAmount;
        }

        // Thống kê theo lý do phạt
        const reason = ticket.fine.reason || 'Lý do khác';
        if (!newStats.finesByReason[reason]) {
          newStats.finesByReason[reason] = 0;
        }
        newStats.finesByReason[reason] += fineAmount;
      }

      // Tính tổng sách
      newStats.totalBooks++;
    });

    // Tính tổng doanh thu: tiền thuê + tiền phạt đã thu
    newStats.totalRevenue = newStats.totalRentalIncome + newStats.totalPaidFines;

    setStats(newStats);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}đ`;
  };

  const renderTimeFilterButton = (value: 'today' | 'week' | 'month' | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        timeFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setTimeFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        timeFilter === value && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentReturnItem = ({ item }: { item: ReturnTicket }) => {
    // Lấy thông tin phiếu mượn từ một trong hai cấu trúc có thể có
    const borrowTicket = item.borrowTicket || item.borrowTicketDetails;
    
    if (!borrowTicket) {
      console.warn('Cannot render return item: Missing borrowTicket data', item);
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={styles.returnItem}
        onPress={() => {
          router.push({
            pathname: '/borrow-ticket-detail',
            params: { id: borrowTicket._id }
          });
        }}
      >
        <View style={styles.returnItemHeader}>
          <Text style={styles.returnItemTitle} numberOfLines={1}>
            {borrowTicket.book.title || 'Không có tiêu đề'}
          </Text>
          <View style={[
            styles.conditionBadge,
            item.condition === 'good' && styles.goodConditionBadge,
            item.condition === 'damaged' && styles.damagedConditionBadge,
            item.condition === 'lost' && styles.lostConditionBadge
          ]}>
            <Text style={styles.conditionBadgeText}>
              {item.condition === 'good' ? 'Tốt' : 
               item.condition === 'damaged' ? 'Hư hỏng' : 'Mất sách'}
            </Text>
          </View>
        </View>
        
        <View style={styles.returnDetails}>
          <View style={styles.returnDetailRow}>
            <Text style={styles.returnDetailLabel}>Người mượn:</Text>
            <Text style={styles.returnDetailValue}>
              {borrowTicket.user.name || borrowTicket.user.fullname || borrowTicket.user.email || 'Không xác định'}
            </Text>
          </View>
          
          <View style={styles.returnDetailRow}>
            <Text style={styles.returnDetailLabel}>Ngày trả:</Text>
            <Text style={styles.returnDetailValue}>
              {dayjs(item.returnDate).format('DD/MM/YYYY')}
            </Text>
          </View>
          
          <View style={styles.returnDetailRow}>
            <Text style={styles.returnDetailLabel}>Tiền thuê:</Text>
            <Text style={styles.returnDetailValue}>
              {formatCurrency(borrowTicket.book.rentalPrice || 0)}
            </Text>
          </View>
          
          {item.fine && (
            <View style={styles.returnDetailRow}>
              <Text style={styles.returnDetailLabel}>Tiền phạt:</Text>
              <Text style={[
                styles.returnDetailValue, 
                styles.fineAmount,
                item.fine.paid && styles.paidFineAmount
              ]}>
                {formatCurrency(item.fine.amount || 0)}
                {item.fine.paid ? ' (Đã thanh toán)' : ' (Chưa thanh toán)'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Thống kê doanh thu',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Đang tải dữ liệu thống kê...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#e74c3c" />
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={fetchReturnTickets}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.retryButton, styles.helpButton]} 
              onPress={() => {
                console.log('Current error:', error);
                alert('Đã ghi lại thông tin lỗi trong console để kiểm tra.');
              }}
            >
              <Text style={styles.retryButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3498db']}
            />
          }
        >
          {/* Bộ lọc thời gian */}
          <View style={styles.filterContainer}>
            {renderTimeFilterButton('today', 'Hôm nay')}
            {renderTimeFilterButton('week', '7 ngày')}
            {renderTimeFilterButton('month', '30 ngày')}
            {renderTimeFilterButton('all', 'Tất cả')}
          </View>

          {/* Thẻ thống kê chính */}
          <View style={styles.mainStatsCard}>
            <View style={styles.statsHeader}>
              <Ionicons name="stats-chart" size={22} color="#3498db" />
              <Text style={styles.statsHeaderText}>Tổng quan doanh thu</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tổng phiếu trả</Text>
                <Text style={styles.statValue}>{stats.totalReturns}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tiền thuê sách</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalRentalIncome)}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tiền phạt đã thu</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalPaidFines)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tiền phạt chưa thu</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalUnpaidFines)}</Text>
              </View>
            </View>

            <View style={styles.totalRevenueContainer}>
              <Text style={styles.totalRevenueLabel}>TỔNG DOANH THU</Text>
              <Text style={styles.totalRevenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
            </View>
          </View>

          {/* Phân loại theo tình trạng sách */}
          <View style={styles.categoryCard}>
            <View style={styles.statsHeader}>
              <Ionicons name="book" size={22} color="#3498db" />
              <Text style={styles.statsHeaderText}>Phân loại tình trạng sách</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.conditionDot, styles.goodConditionDot]} />
                <Text style={styles.statLabel}>Tốt</Text>
                <Text style={styles.statValue}>{stats.returnsByCondition.good}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.conditionDot, styles.damagedConditionDot]} />
                <Text style={styles.statLabel}>Hư hỏng</Text>
                <Text style={styles.statValue}>{stats.returnsByCondition.damaged}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.conditionDot, styles.lostConditionDot]} />
                <Text style={styles.statLabel}>Mất sách</Text>
                <Text style={styles.statValue}>{stats.returnsByCondition.lost}</Text>
              </View>
            </View>
          </View>

          {/* Thống kê lý do phạt */}
          {Object.keys(stats.finesByReason).length > 0 && (
            <View style={styles.categoryCard}>
              <View style={styles.statsHeader}>
                <Ionicons name="warning" size={22} color="#3498db" />
                <Text style={styles.statsHeaderText}>Thống kê lý do phạt</Text>
              </View>

              {Object.entries(stats.finesByReason).map(([reason, amount]) => (
                <View key={reason} style={styles.reasonRow}>
                  <Text style={styles.reasonText}>{reason}</Text>
                  <Text style={styles.reasonAmount}>{formatCurrency(amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Phiếu trả gần đây */}
          <View style={styles.recentReturnsContainer}>
            <Text style={styles.sectionTitle}>Phiếu trả gần đây</Text>
            
            {filteredTickets.length === 0 ? (
              <View style={styles.emptyReturnsContainer}>
                <Ionicons name="document-text-outline" size={50} color="#ccc" />
                <Text style={styles.emptyReturnsText}>Không có phiếu trả nào</Text>
              </View>
            ) : (
              <FlatList
                data={filteredTickets.slice(0, 10)}
                renderItem={renderRecentReturnItem}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#777',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#e74c3c',
    marginBottom: 20,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  helpButton: {
    backgroundColor: '#7f8c8d',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 5,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mainStatsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalRevenueContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  totalRevenueLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  totalRevenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 5,
  },
  goodConditionDot: {
    backgroundColor: '#2ecc71',
  },
  damagedConditionDot: {
    backgroundColor: '#f39c12',
  },
  lostConditionDot: {
    backgroundColor: '#e74c3c',
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reasonText: {
    flex: 3,
    fontSize: 14,
    color: '#555',
  },
  reasonAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'right',
  },
  recentReturnsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  returnItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  returnItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  returnItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goodConditionBadge: {
    backgroundColor: '#e6f7ee',
  },
  damagedConditionBadge: {
    backgroundColor: '#fef5e7',
  },
  lostConditionBadge: {
    backgroundColor: '#fdedec',
  },
  conditionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  returnDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  returnDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  returnDetailLabel: {
    width: 90,
    fontSize: 14,
    color: '#777',
  },
  returnDetailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  fineAmount: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  paidFineAmount: {
    color: '#2ecc71',
  },
  emptyReturnsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  emptyReturnsText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
}); 