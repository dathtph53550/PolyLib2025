import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { bookService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBorrowTickets } from '../redux/slices/borrowTicketsSlice';
import dayjs from 'dayjs';
import { fetchNotifications } from '../redux/slices/notificationsSlice';

// Book interface to match the API response
interface Book {
  _id: string;
  title: string;
  author: string;
  category: {
    _id: string;
    name?: string;
  };
  image: string;
  description: string;
  available: boolean;
  isHot?: boolean;
  createdAt: string;
  rentalPrice: number;
  quantity: number;
  __v: number;
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

export default function HomeScreen() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { items: borrowTickets, loading: borrowLoading } = useSelector((state: any) => state.borrowTickets);
  const { unreadCount: notificationCount } = useSelector((state: any) => state.notifications);
  const [books, setBooks] = useState<Book[]>([]);
  const [hotBooks, setHotBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch books when component mounts
    fetchBooks();
    
    // Fetch borrow tickets and notifications when component mounts
    if (user?.token) {
      // @ts-ignore - Ignore TypeScript errors for thunks
      dispatch(fetchUserBorrowTickets(user.token));
      // @ts-ignore - Ignore TypeScript errors for thunks  
      dispatch(fetchNotifications(user.token));
    }
  }, [user?.token]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch books from API using the token for authentication
      const response = await bookService.getBooks();
      console.log('Books response:', response);
      
      if (response && response.data) {
        setBooks(response.data);
        
        // Filter hot books for the carousel
        const hotBooksFiltered = response.data.filter((book: Book) => book.isHot === true);
        if (hotBooksFiltered.length > 0) {
          setHotBooks(hotBooksFiltered);
        } else {
          // Fallback: if no books marked as hot, use the first 2 books
          setHotBooks(response.data.slice(0, 2));
        }
      }
    } catch (err: any) {
      console.error('Error fetching books:', err);
      setError(err.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc phiếu mượn để lấy số phiếu "đang mượn"
  const activeBorrowedTickets = borrowTickets.filter(
    (ticket: BorrowTicket) => ticket.status === 'approved'
  );

  // Kiểm tra phiếu mượn nào sắp đến hạn (trong vòng 2 ngày)
  const isUpcomingDue = (dueDate: string) => {
    const today = dayjs().startOf('day');
    const due = dayjs(dueDate).startOf('day');
    const diffDays = due.diff(today, 'day');
    return diffDays >= 0 && diffDays <= 2;
  };

  // Lọc phiếu mượn sắp đến hạn
  const upcomingDueTickets = activeBorrowedTickets.filter(
    (ticket: BorrowTicket) => isUpcomingDue(ticket.dueDate)
  );

  // Sắp xếp phiếu mượn sắp đến hạn theo ngày đến hạn tăng dần
  const sortedUpcomingDueTickets = [...upcomingDueTickets].sort((a, b) => 
    dayjs(a.dueDate).diff(dayjs(b.dueDate))
  );

  // Lấy thông tin phiếu mượn sớm nhất đến hạn
  const earliestDueTicket = sortedUpcomingDueTickets.length > 0 ? sortedUpcomingDueTickets[0] : null;

  // Tính số ngày còn lại cho phiếu mượn sớm nhất
  const getDaysLeft = (dueDate: string) => {
    const today = dayjs().startOf('day');
    const due = dayjs(dueDate).startOf('day');
    return due.diff(today, 'day');
  };

  const navigateToBookDetail = (book: Book) => {
    router.push({
      pathname: '/book-detail',
      params: { 
        id: book._id,
        title: book.title,
        author: book.author,
        description: book.description,
        image: book.image,
        category: book.category?.name || '',
        available: book.available ? '1' : '0',
        rentalPrice: book.rentalPrice.toString(),
        quantity: book.quantity.toString()
      }
    });
  };

  // Render a book item in the grid
  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => navigateToBookDetail(item)}
    >
      <View style={styles.bookImageContainer}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.bookCardImage}
            defaultSource={require('../../assets/images/react-logo.png')}
          />
        ) : (
          <View style={styles.bookCardImagePlaceholder}>
            <Ionicons name="book-outline" size={30} color="#ccc" />
          </View>
        )}
        {item.isHot && (
          <View style={styles.hotTag}>
            <Text style={styles.hotTagText}>HOT</Text>
          </View>
        )}
      </View>
      <View style={styles.bookCardContent}>
        <Text style={styles.bookCardText} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthorText} numberOfLines={1}>{item.author}</Text>
        <View style={styles.bookInfoRow}>
          <View style={styles.priceContainer}>
            <Ionicons name="pricetag" size={14} color="#3498db" />
            <Text style={styles.priceText}>{item.rentalPrice.toLocaleString()}đ</Text>
          </View>
          <View style={styles.quantityContainer}>
            <Ionicons name="library" size={14} color="#2ecc71" />
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render a hot book item in the carousel
  const renderHotBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.hotBookCard}
      onPress={() => navigateToBookDetail(item)}
    >
      <View style={styles.hotBookImageContainer}>
        <Image
          source={{ uri: item.image || 'https://m.media-amazon.com/images/I/61Zi2jjgfIL._AC_UF1000,1000_QL80_.jpg' }}
          style={styles.hotBookImage}
          defaultSource={require('../../assets/images/react-logo.png')}
        />
        <View style={styles.hotTagLarge}>
          <Text style={styles.hotTagText}>HOT</Text>
        </View>
      </View>
      <View style={styles.hotBookContent}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <View style={styles.bookInfoRow}>
          <View style={styles.priceContainer}>
            <Ionicons name="pricetag" size={14} color="#3498db" />
            <Text style={styles.priceText}>{item.rentalPrice.toLocaleString()}đ</Text>
          </View>
          <View style={styles.quantityContainer}>
            <Ionicons name="library" size={14} color="#2ecc71" />
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.bookDescription} numberOfLines={2}>{item.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/images/logooo.png')} style={styles.logoImage} />
            </View>
            <Text style={styles.appName}>PolyLib</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationIcon}
            onPress={() => {
              router.navigate('/(tabs)/notifications');
            }}
          >
            <Ionicons name="notifications" size={24} color="#FF9500" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Book Borrowed Section */}
        <TouchableOpacity 
          style={styles.borrowedBooksCard}
          onPress={() => router.push('/(tabs)/borrow-tickets')}
          activeOpacity={0.7}
        >
          <View style={styles.dueDateHeader}>
            <View style={styles.dueDateTitleContainer}>
              <Ionicons name="book-outline" size={20} color="#3498db" />
              <Text style={styles.borrowedBooksTitle}>Sách đang mượn</Text>
            </View>
            <Text style={styles.statsCount}>{activeBorrowedTickets.length}</Text>
          </View>
          
          <View style={styles.borrowedBooksInfoContainer}>
            <Ionicons name="library-outline" size={18} color="#3498db" />
            <Text style={styles.borrowedBooksInfo}>
              {borrowLoading 
                ? 'Đang tải thông tin phiếu mượn...' 
                : activeBorrowedTickets.length > 0 
                  ? `Bạn đang mượn ${activeBorrowedTickets.length} cuốn sách. Nhấn để xem thông tin chi tiết các phiếu mượn.` 
                  : 'Bạn chưa mượn sách nào. Nhấn để xem lịch sử phiếu mượn.'}
            </Text>
          </View>
          
          <View style={styles.viewAllLink}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={14} color="#6B4EFF" />
          </View>
        </TouchableOpacity>

        {/* Due Date Section */}
        {activeBorrowedTickets.length > 0 && (
          <TouchableOpacity 
            style={styles.dueDateCard}
            onPress={() => router.push('/(tabs)/borrow-tickets')}
            activeOpacity={0.7}
          >
            <View style={styles.dueDateHeader}>
              <View style={styles.dueDateTitleContainer}>
                <Ionicons name="time-outline" size={20} color="#e74c3c" />
                <Text style={styles.dueDateTitle}>Sắp đến hạn</Text>
              </View>
              <Text style={styles.statsCount}>{upcomingDueTickets.length}</Text>
            </View>
            
            {upcomingDueTickets.length > 0 && earliestDueTicket && (
              <View style={styles.dueDateInfoContainer}>
                <Ionicons name="calendar" size={18} color="#e74c3c" />
                <View style={styles.dueDateInfo}>
                  <Text style={styles.dueDateLabel}>Ngày trả sớm nhất:</Text>
                  <Text style={styles.dueDateValue}>
                    {dayjs(earliestDueTicket.dueDate).format('DD/MM/YYYY')}
                  </Text>
                </View>
                <View style={styles.daysLeftBadge}>
                  <Text style={styles.daysLeftText}>
                    {(() => {
                      const daysLeft = getDaysLeft(earliestDueTicket.dueDate);
                      if (daysLeft === 0) return 'Hôm nay';
                      if (daysLeft === 1) return '1 ngày';
                      return `${daysLeft} ngày`;
                    })()}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.viewAllLink}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={14} color="#6B4EFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Hot Books Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Book Hot</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {hotBooks.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {hotBooks.map(book => (
                    <View key={book._id}>
                      {renderHotBookItem({ item: book })}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noDataText}>No hot books available</Text>
              )}
            </ScrollView>
          )}
        </View>

        {/* All Books Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Book</Text>
            <TouchableOpacity onPress={() => router.push('/all-books')}>
              <Text style={styles.moreText}>more</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.booksGrid}>
              {books.length > 0 ? (
                books.slice(0, 4).map((book) => (
                  <React.Fragment key={book._id}>
                    {renderBookItem({ item: book })}
                  </React.Fragment>
                ))
              ) : (
                <Text style={styles.noDataText}>No books available</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  notificationIcon: {
    padding: 5,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  borrowedBooksCard: {
    borderWidth: 1,
    borderColor: '#cce5ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dueDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dueDateTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  borrowedBooksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  borrowedBooksInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  borrowedBooksInfo: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  dueDateCard: {
    borderWidth: 1,
    borderColor: '#ffcccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dueDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  dueDateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dueDateInfo: {
    flex: 1,
    marginLeft: 8,
  },
  dueDateLabel: {
    fontSize: 12,
    color: '#666',
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  daysLeftBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysLeftText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewAllText: {
    color: '#6B4EFF',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionContainer: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  moreText: {
    color: '#666',
  },
  horizontalList: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  hotBookCard: {
    width: 200,
    marginRight: 15,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 0.4,
  },
  hotBookImageContainer: {
    position: 'relative',
    width: 150,
    height: 200,
  },
  hotBookImage: {
    width: 150,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookCard: {
    width: '48%',
    height: 320,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 6,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  bookCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  bookCardImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookCardText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  bookAuthorText: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  bookDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    fontStyle: 'italic',
  },
  bookInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 5,
  },
  errorText: {
    color: "#e74c3c",
    marginLeft: 5,
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 20,
  },
  hotTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
  },
  hotTagLarge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  hotTagText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  hotBookContent: {
    padding: 8,
  },
  statsCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
});
