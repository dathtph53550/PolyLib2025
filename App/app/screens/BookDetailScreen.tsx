import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { showRegistrationModal } from '../redux/slices/registrationSlice';
// import { showBorrowModal } from '../redux/slices/borrowTicketSlice';
import RegistrationModal from '../components/RegistrationModal';
import BorrowTicketModal from '../components/BorrowTicketModal';

interface BookParams {
  id: string;
  title: string;
  author: string;
  description: string;
  image: string;
  category?: string;
  available: boolean;
  rentalPrice: string;
  quantity: string;
  authorImage?: string;
  dueDate?: string;
  borrowDate?: string;
}

export default function BookDetailScreen() {
  const params = useLocalSearchParams();
  const isAvailable = params.available === '1';
  const dispatch = useDispatch();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isDueSoon, setIsDueSoon] = useState(false);

  useEffect(() => {
    if (params.dueDate) {
      const days = calculateDaysLeft(params.dueDate.toString());
      setDaysLeft(days);
      setIsDueSoon(days <= 3 && days >= 0);
    }
  }, [params.dueDate]);

  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDueDateColor = () => {
    if (!daysLeft && daysLeft !== 0) return '#3498db';
    if (daysLeft < 0) return '#e74c3c';
    if (daysLeft <= 2) return '#e74c3c';
    if (daysLeft <= 5) return '#f39c12';
    return '#2ecc71';
  };

  const handleRegistration = () => {
    dispatch(showRegistrationModal());
  };

  if (!params.id) {
    return (
      <View style={styles.centered}>
        <Text>Book not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Dark Header Section */}
      <View style={styles.darkSection}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.bookPreview}>
            <Image
              source={{ uri: params.image?.toString() }}
              style={styles.bookImage}
              defaultSource={require('../../assets/images/react-logo.png')}
            />
            <View style={styles.bookInfo}>
              <Text style={styles.title}>{params.title}</Text>
              <Text style={styles.subtitle}>{params.description}</Text>
              <View style={styles.bookMetaInfo}>
                {params.category && (
                  <View style={styles.categoryBadge}>
                    <Ionicons name="bookmark" size={16} color="#6B4EFF" />
                    <Text style={styles.categoryText}>{params.category}</Text>
                  </View>
                )}
                <View style={styles.stockBadge}>
                  <Ionicons name="library" size={16} color="#2ECC71" />
                  <Text style={styles.stockText}>{params.quantity} cuốn</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.contentSection}>
        {/* Due Date Card - Show only if we have a due date */}
        {params.dueDate && daysLeft !== null && (
          <View style={[styles.card, styles.dueDateCard, { borderLeftColor: getDueDateColor() }]}>
            <View style={styles.dueDateHeader}>
              <View style={styles.dueDateTitleContainer}>
                <Ionicons name="alert-circle" size={24} color={getDueDateColor()} />
                <Text style={[styles.dueDateTitle, { color: getDueDateColor() }]}>
                  {daysLeft < 0 
                    ? 'Sách đã quá hạn!' 
                    : daysLeft === 0 
                      ? 'Sách đến hạn hôm nay!'
                      : daysLeft <= 2
                        ? 'Sách sắp đến hạn!' 
                        : 'Thông tin mượn sách'}
                </Text>
              </View>
              {daysLeft !== null && daysLeft >= 0 && (
                <View style={[styles.countdownBadge, { backgroundColor: getDueDateColor() }]}>
                  <Text style={styles.countdownText}>
                    {daysLeft === 0 ? 'Hôm nay' : daysLeft === 1 ? '1 ngày' : `${daysLeft} ngày`}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.dueDateInfo}>
              <View style={styles.dueDateRow}>
                <Text style={styles.dueDateLabel}>Ngày mượn:</Text>
                <Text style={styles.dueDateValue}>
                  {params.borrowDate 
                    ? new Date(params.borrowDate.toString()).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.dueDateRow}>
                <Text style={styles.dueDateLabel}>Ngày hẹn trả:</Text>
                <Text style={[styles.dueDateValue, daysLeft && daysLeft < 0 ? styles.overdueText : {}]}>
                  {params.dueDate 
                    ? new Date(params.dueDate.toString()).toLocaleDateString('vi-VN')
                    : 'N/A'}
                  {daysLeft && daysLeft < 0 && ' (Quá hạn)'}
                </Text>
              </View>
            </View>
            
            {isDueSoon && (
              <View style={styles.reminder}>
                <Ionicons name="calendar" size={18} color="#e74c3c" />
                <Text style={styles.reminderText}>
                  Vui lòng trả sách đúng hạn để tránh phí phạt
                </Text>
              </View>
            )}
            
            {daysLeft !== null && daysLeft < 0 && (
              <View style={styles.overdueBanner}>
                <Ionicons name="warning" size={18} color="#fff" />
                <Text style={styles.overdueBannerText}>
                  Sách đã quá hạn {Math.abs(daysLeft)} ngày! Vui lòng trả sách ngay.
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Author Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Author</Text>
          <View style={styles.authorCard}>
            <Image
              source={
                params.authorImage 
                  ? { uri: params.authorImage } 
                  : require("../../assets/images/author.jpg")
              }
              defaultSource={require("../../assets/images/author.jpg")}
              style={styles.authorImage}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{params.author}</Text>
              <Text style={styles.authorBio}>Best Seller of New York Times</Text>
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="star-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.label}>About The Book</Text>
          <Text style={styles.aboutText}>
            'The Psychology of Money' is an essential read for anyone interested in being better with money. Fast-paced and engaging, this book will help you refine your thoughts towards money. You can finish this book in a week, unlike other books that are too lengthy.{'\n\n'}
            The most important emotions in relation to money are fear, guilt, shame and envy. It's worth spending some effort to become aware of the emotions that are especially tied to money for you because, without awareness, they will tend to override rational thinking and drive your actions.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Rental Price</Text>
            <Text style={styles.priceValue}>{parseInt(params.rentalPrice?.toString() || '0').toLocaleString()}đ</Text>
          </View>
          <View style={styles.buttonGroup}>
            {params.dueDate ? (
              <TouchableOpacity 
                style={styles.returnButton}
                onPress={() => router.push({
                  pathname: '/(tabs)/borrow-tickets',
                  params: { return: params.id }
                })}
              >
                <Ionicons name="return-down-back" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Trả sách</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, !isAvailable && styles.actionButtonDisabled]}
                disabled={!isAvailable}
                onPress={() => dispatch(showRegistrationModal())}
              >
                <Text style={styles.actionButtonText}>Đăng ký</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <RegistrationModal bookId={params.id.toString()} />
      <BorrowTicketModal bookId={params.id.toString()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkSection: {
    backgroundColor: '#1A1B2E',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bookPreview: {
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bookImage: {
    width: 140,
    height: 200,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9FA0AB',
    marginBottom: 16,
    lineHeight: 20,
  },
  bookMetaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockText: {
    color: '#2ECC71',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  contentSection: {
    flex: 1,
    marginTop: -20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dueDateCard: {
    borderLeftWidth: 4,
    backgroundColor: '#fff9f9',
  },
  dueDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dueDateTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  countdownBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dueDateInfo: {
    marginBottom: 12,
  },
  dueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dueDateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  overdueText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reminderText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontSize: 14,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  overdueBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  lastCard: {
    marginBottom: 100, // Extra space for bottom bar
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1B2E',
    marginBottom: 16,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
  },
  authorImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E9ECEF',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  authorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1B2E',
    marginBottom: 4,
  },
  authorBio: {
    fontSize: 14,
    color: '#9FA0AB',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 36,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#9FA0AB',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1B2E',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 60,
    paddingVertical: 25,
    borderRadius: 20,
    shadowColor: '#6B4EFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonDisabled: {
    backgroundColor: '#9FA0AB',
    shadowColor: '#9FA0AB',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 40,
    paddingVertical: 25,
    borderRadius: 20,
    shadowColor: '#e74c3c',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
});