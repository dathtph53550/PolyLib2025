import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Toast from 'react-native-toast-message';
import API from '../services/api';

interface Book {
  _id: string;
  title: string;
  author: string;
  image?: string;
  rentalPrice: number;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  username?: string;
}

interface ReturnInfo {
  returnDate?: string;
  condition?: string;
  fine?: {
    amount: number;
    reason: string;
    paid: boolean;
  };
  processedBy?: User;
  note?: string;
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
  returnInfo?: ReturnInfo;
}

interface StatusStyle {
  color: string;
  borderColor: string;
}

const BorrowTicketManagerScreen: React.FC = () => {
  const [tickets, setTickets] = useState<BorrowTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<BorrowTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<BorrowTicket | null>(null);
  const [processingModal, setProcessingModal] = useState<boolean>(false);
  const [fine, setFine] = useState<string>('0');
  const [selectedCondition, setSelectedCondition] = useState<string>('good');
  const [returnNote, setReturnNote] = useState<string>('');
  const [fineReason, setFineReason] = useState<string>('');
  const [finePaid, setFinePaid] = useState<boolean>(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  useEffect(() => {
    filterTickets();
  }, [searchQuery, tickets]);

  const loadTickets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const queryString = statusFilter ? `?status=${statusFilter}` : '';
      const response = await API.get(`/api/users/borrow-tickets${queryString}`);
      console.log("API response:", response.data);
      
      // Handle the specific API response format
      if (response.data && Array.isArray(response.data.data)) {
        setTickets(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        console.warn("Unexpected API response format", response.data);
        setTickets([]);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch borrow tickets:', error);
      setLoading(false);
      setError(error.response?.data?.message || 'Failed to fetch borrow tickets');
      setTickets([]);
    }
  };

  const filterTickets = (): void => {
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      setFilteredTickets([]);
      return;
    }
    
    const filtered = tickets.filter((ticket: BorrowTicket) => {
      const query = searchQuery.toLowerCase();
      return (
        (ticket.book?.title?.toLowerCase().includes(query)) ||
        (ticket.user?.fullName?.toLowerCase().includes(query)) ||
        (ticket.user?.email?.toLowerCase().includes(query))
      );
    });
    
    setFilteredTickets(filtered);
  };

  const handleSearch = (text: string): void => {
    setSearchQuery(text);
  };

  const handleFilterStatus = (status: string): void => {
    setStatusFilter(status);
  };

  const handleMarkAsReturned = (ticket: BorrowTicket): void => {
    setSelectedTicket(ticket);
    
    // Reset các giá trị trong modal
    setSelectedCondition('good');
    setReturnNote('');
    
    // Tính tiền phạt tự động
    const dueDate = dayjs(ticket.dueDate).startOf('day');
    const today = dayjs().startOf('day');
    let calculatedFine = 0;
    let reason = '';
    
    // Phạt trả muộn
    if (today.isAfter(dueDate)) {
      const daysLate = today.diff(dueDate, 'day');
      calculatedFine = daysLate * 10000; // 10,000 VND mỗi ngày trễ
      reason = `Trả sách trễ ${daysLate} ngày`;
    }
    
    setFine(calculatedFine.toString());
    setFineReason(reason);
    setFinePaid(false);
    
    setProcessingModal(true);
  };

  const calculateFineForCondition = (condition: string, book: Book): number => {
    const rentalPrice = book?.rentalPrice || 0;
    
    switch (condition) {
      case 'damaged':
        return Math.round(rentalPrice * 0.5); // 50% giá sách
      case 'lost':
        return Math.round(rentalPrice * 2); // 200% giá sách
      default:
        return 0;
    }
  };

  const handleConditionChange = (condition: string): void => {
    if (!selectedTicket) return;
    
    setSelectedCondition(condition);
    
    // Tính lại tiền phạt dựa trên tình trạng sách
    const dueDate = dayjs(selectedTicket.dueDate).startOf('day');
    const today = dayjs().startOf('day');
    let calculatedFine = 0;
    let reason = '';
    
    // Phạt trả muộn (giữ nguyên)
    if (today.isAfter(dueDate)) {
      const daysLate = today.diff(dueDate, 'day');
      calculatedFine = daysLate * 10000; // 10,000 VND mỗi ngày trễ
      reason = `Trả sách trễ ${daysLate} ngày`;
    }
    
    // Thêm phạt theo tình trạng sách
    const conditionFine = calculateFineForCondition(condition, selectedTicket.book);
    if (conditionFine > 0) {
      calculatedFine += conditionFine;
      
      if (reason) {
        reason += ' và ';
      }
      
      if (condition === 'damaged') {
        reason += 'Sách bị hư hỏng';
      } else if (condition === 'lost') {
        reason += 'Sách bị mất';
      }
    }
    
    setFine(calculatedFine.toString());
    setFineReason(reason);
  };

  const confirmReturn = async (): Promise<void> => {
    if (!selectedTicket) return;
    
    try {
      const fineAmount = parseInt(fine);
      // Cập nhật endpoint mới
      const endpoint = `http://localhost:3000/api/users/return-tickets`;
      
      await API.post(endpoint, { 
        borrowTicket: selectedTicket._id,
        condition: selectedCondition,
        note: returnNote,
        fine: {
          amount: fineAmount,
          reason: fineAmount > 0 ? fineReason : "",
          paid: finePaid
        }
      });
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã trả sách thành công',
      });
      
      setProcessingModal(false);
      setTimeout(() => {
        loadTickets();
      }, 500);
    } catch (error: any) {
      console.error('Không thể trả sách:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.response?.data?.message || 'Không thể trả sách',
      });
    }
  };

  const handleApprove = async (ticket: BorrowTicket): Promise<void> => {
    try {
      await API.put(`/api/users/borrow-tickets/${ticket._id}/approve`);
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Phiếu mượn đã được duyệt',
      });
      
      setTimeout(() => {
        loadTickets();
      }, 500);
    } catch (error: any) {
      console.error('Failed to approve ticket:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.response?.data?.message || 'Không thể duyệt phiếu mượn',
      });
    }
  };

  const handleReject = async (ticket: BorrowTicket): Promise<void> => {
    try {
      await API.put(`/api/users/borrow-tickets/${ticket._id}/reject`);
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Phiếu mượn đã bị từ chối',
      });
      
      setTimeout(() => {
        loadTickets();
      }, 500);
    } catch (error: any) {
      console.error('Failed to reject ticket:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.response?.data?.message || 'Không thể từ chối phiếu mượn',
      });
    }
  };

  const formatDate = (date: string): string => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const isOverdue = (dueDate: string): boolean => {
    const today = dayjs().startOf('day');
    const due = dayjs(dueDate).startOf('day');
    return today.isAfter(due) || today.isSame(due);
  };

  const getDaysOverdue = (dueDate?: string): number => {
    if (!dueDate) return 0;
    
    const today = dayjs().startOf('day');
    const due = dayjs(dueDate).startOf('day');
    
    if (today.isAfter(due)) {
      return today.diff(due, 'day');
    }
    return 0;
  };

  const getOverdueText = (dueDate?: string): string => {
    if (!dueDate) return '';
    
    const today = dayjs().startOf('day');
    const due = dayjs(dueDate).startOf('day');
    
    if (today.isSame(due)) {
      return 'Hôm nay';
    } else if (today.isAfter(due)) {
      const days = today.diff(due, 'day');
      return `Quá hạn ${days} ngày`;
    } else {
      const days = due.diff(today, 'day');
      return `Còn ${days} ngày`;
    }
  };

  const getBorderColor = (status: string, dueDate?: string): string => {
    if (status === 'approved' || status === 'borrowed') {
      return isOverdue(dueDate || '') ? '#FF3B30' : '#007AFF';
    } else if (status === 'returned') {
      return '#34C759';
    } else if (status === 'pending') {
      return '#FF9500';
    } else if (status === 'cancelled') {
      return '#8E8E93';
    }
    return '#999999';
  };

  const getStatusStyles = (status: string, dueDate?: string): StatusStyle => {
    if (status === 'borrowed' || status === 'approved') {
      if (isOverdue(dueDate || '')) {
        return { color: '#FF3B30', borderColor: '#FF3B30' };
      }
      return { color: '#007AFF', borderColor: '#007AFF' };
    } else if (status === 'returned') {
      return { color: '#34C759', borderColor: '#34C759' };
    } else if (status === 'pending') {
      return { color: '#FF9500', borderColor: '#FF9500' };
    } else if (status === 'cancelled') {
      return { color: '#8E8E93', borderColor: '#8E8E93' };
    }
    return { color: '#000', borderColor: '#000' };
  };

  // Hàm để hiển thị trạng thái bằng tiếng Việt
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'approved':
      case 'borrowed':
        return 'Đang mượn';
      case 'returned':
        return 'Đã trả';
      default:
        return status;
    }
  };

  // Hàm lấy màu cho badge trạng thái
  const getStatusBadgeStyle = (status: string): object => {
    switch (status) {
      case 'approved':
      case 'borrowed':
        return styles.borrowedBadge;
      case 'returned':
        return styles.approvedBadge;
      case 'pending':
        return styles.pendingBadge;
      case 'cancelled':
        return styles.rejectedBadge;
      default:
        return {};
    }
  };

  // Hàm kiểm tra xem phiếu mượn đã có thông tin phiếu trả chưa
  const hasReturnInfo = (ticket: BorrowTicket): boolean => {
    return ticket.status === 'returned' && ticket.returnInfo !== undefined;
  };

  // Hàm kiểm tra xem phiếu có bị phạt hay không
  const hasFine = (ticket: BorrowTicket): boolean => {
    return hasReturnInfo(ticket) && 
           ticket.returnInfo?.fine !== undefined && 
           (ticket.returnInfo?.fine?.amount || 0) > 0;
  };

  const renderTicketItem = ({ item }: { item: BorrowTicket }) => {
    const overdue = isOverdue(item.dueDate);
    const daysOverdue = getDaysOverdue(item.dueDate);
    const statusText = getStatusText(item.status);
    const badgeStyle = getStatusBadgeStyle(item.status);
    
    return (
      <View style={styles.ticketItem}>
        <View style={styles.ticketContent}>
          <View style={styles.ticketHeader}>
            <Text style={styles.bookTitle} numberOfLines={1}>{item.book?.title || 'Không tìm thấy'}</Text>
            <View style={[styles.statusBadge, badgeStyle]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
          
          <View style={styles.ticketInfo}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Người mượn: </Text>
              <Text style={styles.infoValue}>{item.user?.fullName || item.user?.username || 'Không tìm thấy'}</Text>
            </Text>
            
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Email: </Text>
              <Text style={styles.infoValue}>{item.user?.email || 'Không tìm thấy'}</Text>
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Ngày mượn: </Text>
                <Text style={styles.infoValue}>{formatDate(item.borrowDate)}</Text>
              </Text>
              
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Giá mượn: </Text>
                <Text style={styles.rentalPrice}>{item.book?.rentalPrice?.toLocaleString('vi-VN')} VNĐ</Text>
              </Text>
            </View>
            
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Hạn trả: </Text>
              <Text style={[styles.infoValue, overdue && styles.overdueText]}>
                {formatDate(item.dueDate)}
                {item.status !== 'returned' && (
                  <Text style={overdue ? styles.overdueText : styles.daysRemainingText}>
                    {' '}({getOverdueText(item.dueDate)})
                  </Text>
                )}
              </Text>
            </Text>
            
            {item.note && (
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Ghi chú mượn: </Text>
                <Text style={styles.noteText}>{item.note}</Text>
              </Text>
            )}

            {/* Hiển thị thông tin phiếu phạt nếu quá hạn (chỉ khi đang mượn) */}
            {overdue && (item.status === 'approved' || item.status === 'borrowed') && (
              <View style={styles.fineWarning}>
                <Ionicons name="warning-outline" size={16} color="#FF3B30" style={styles.warningIcon} />
                <Text style={styles.fineWarningText}>
                  {(() => {
                    const today = dayjs().startOf('day');
                    const dueDate = dayjs(item.dueDate).startOf('day');
                    
                    if (today.isSame(dueDate)) {
                      return "Sách đến hạn hôm nay, nếu không trả sẽ bị phạt";
                    } else {
                      return `Sách ${getOverdueText(item.dueDate)}, tiền phạt dự kiến: ${(getDaysOverdue(item.dueDate) * 10000).toLocaleString('vi-VN')} VNĐ`;
                    }
                  })()}
                </Text>
              </View>
            )}
          </View>
          
          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.approveButton}
                onPress={() => handleApprove(item)}
              >
                <Text style={styles.approveButtonText}>Duyệt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => handleReject(item)}
              >
                <Text style={styles.rejectButtonText}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {(item.status === 'approved' || item.status === 'borrowed') && (
            <TouchableOpacity 
              style={styles.returnButton}
              onPress={() => handleMarkAsReturned(item)}
            >
              <Text style={styles.returnButtonText}>Trả Sách</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản Lý Phiếu Mượn</Text>
        <TouchableOpacity onPress={loadTickets}>
          <Ionicons name="refresh-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên sách hoặc người mượn"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === '' && styles.activeFilter]}
            onPress={() => handleFilterStatus('')}
          >
            <Text style={[styles.filterText, statusFilter === '' && styles.activeFilterText]}>Tất cả</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'approved' && styles.activeFilter]}
            onPress={() => handleFilterStatus('approved')}
          >
            <Text style={[styles.filterText, statusFilter === 'approved' && styles.activeFilterText]}>Đang mượn</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.messageText}>Đang tải phiếu mượn...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>Lỗi: {error === "Vui lòng xác thực" ? "Bạn cần đăng nhập" : error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTickets}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTickets.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.messageText}>Không tìm thấy phiếu mượn nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.ticketList}
          refreshing={loading}
          onRefresh={loadTickets}
        />
      )}
      
      <Modal
        visible={processingModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Trả Sách</Text>
            
            {selectedTicket && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.modalText}>Sách: {selectedTicket.book?.title || 'Không tìm thấy'}</Text>
                <Text style={styles.modalText}>
                  Người mượn: {selectedTicket.user?.fullName || selectedTicket.user?.username || 'Không tìm thấy'}
                </Text>
                {selectedTicket.user?.email && (
                  <Text style={styles.modalText}>Email: {selectedTicket.user.email}</Text>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tình trạng sách:</Text>
                  <View style={styles.conditionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.conditionButton, selectedCondition === 'good' && styles.conditionButtonSelected]}
                      onPress={() => handleConditionChange('good')}
                    >
                      <Text style={[styles.conditionButtonText, selectedCondition === 'good' && styles.conditionButtonTextSelected]}>Tốt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.conditionButton, selectedCondition === 'damaged' && styles.conditionButtonSelected]}
                      onPress={() => handleConditionChange('damaged')}
                    >
                      <Text style={[styles.conditionButtonText, selectedCondition === 'damaged' && styles.conditionButtonTextSelected]}>Hư hỏng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.conditionButton, selectedCondition === 'lost' && styles.conditionButtonSelected]}
                      onPress={() => handleConditionChange('lost')}
                    >
                      <Text style={[styles.conditionButtonText, selectedCondition === 'lost' && styles.conditionButtonTextSelected]}>Mất sách</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ghi chú:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={returnNote}
                    onChangeText={setReturnNote}
                    placeholder="Nhập ghi chú (không bắt buộc)"
                    multiline
                  />
                </View>
                
                {parseInt(fine) > 0 && (
                  <>
                    <View style={styles.fineContainer}>
                      <Text style={styles.fineLabel}>Tiền phạt (VNĐ):</Text>
                      <View style={styles.fineDisplay}>
                        <Text style={styles.fineValue}>{parseInt(fine).toLocaleString('vi-VN')}</Text>
                      </View>
                    </View>
                    
                    {fineReason && (
                      <View style={styles.fineReasonContainer}>
                        <Text style={styles.fineReasonLabel}>Lý do phạt:</Text>
                        <Text style={styles.fineReasonText}>{fineReason}</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.paidCheckbox} 
                      onPress={() => setFinePaid(!finePaid)}
                    >
                      <View style={[styles.checkbox, finePaid && styles.checkboxChecked]}>
                        {finePaid && <Ionicons name="checkmark" size={16} color="#FFF" />}
                      </View>
                      <Text style={styles.checkboxLabel}>Đã thanh toán tiền phạt</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setProcessingModal(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmReturn}
              >
                <Text style={styles.confirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filterContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#FFF',
    fontWeight: '500',
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
    backgroundColor: '#E0E0E0',
  },
  approvedBadge: {
    backgroundColor: '#4CD964',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  rejectedBadge: {
    backgroundColor: '#FF3B30',
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
  noteText: {
    color: '#333',
    fontStyle: 'italic',
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#4CD964',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  returnButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  overdueButton: {
    backgroundColor: '#007AFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 20,
    maxHeight: 400,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 8,
  },
  fineContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  fineLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  fineInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 6,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    marginLeft: 6,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '600',
  },
  borrowedBadge: {
    backgroundColor: '#007AFF',
  },
  inputGroup: {
    marginTop: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    minHeight: 80,
  },
  conditionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  conditionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  conditionButtonText: {
    color: '#333',
    fontSize: 14,
  },
  conditionButtonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  paidCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
  fineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEC',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  warningIcon: {
    marginRight: 6,
  },
  fineWarningText: {
    fontSize: 13,
    color: '#FF3B30',
    flex: 1,
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
  daysRemainingText: {
    color: '#34C759',
    fontWeight: '600',
  },
  fineDisplay: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  fineValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  fineReasonContainer: {
    marginBottom: 16,
  },
  fineReasonLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  fineReasonText: {
    fontSize: 15,
    color: '#FF3B30',
    fontStyle: 'italic',
  },
});

export default BorrowTicketManagerScreen; 