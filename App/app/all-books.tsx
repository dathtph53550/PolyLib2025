import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { bookService } from './services/api';

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

export default function AllBooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch books when component mounts
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch books from API
      const response = await bookService.getBooks();
      
      if (response && response.data) {
        setBooks(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching books:', err);
      setError(err.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
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
            defaultSource={require('../assets/images/react-logo.png')}
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
        <Text style={styles.bookCardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookCardAuthor} numberOfLines={1}>{item.author}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category?.name || 'Không phân loại'}</Text>
        </View>
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
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.customHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả sách</Text>
        <View style={styles.emptySpace} />
      </View>
      
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.noDataText}>Không có sách nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  emptySpace: {
    width: 40,
  },
  gridContainer: {
    padding: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCard: {
    flex: 1,
    margin: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: '50%',
  },
  bookImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.75,
    marginBottom: 8,
  },
  bookCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    resizeMode: 'cover',
  },
  bookCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333',
  },
  bookCardAuthor: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    color: '#666',
  },
  bookInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
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
    fontSize: 11,
    color: '#3498db',
    fontWeight: 'bold',
    marginLeft: 3,
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
    fontSize: 11,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginLeft: 3,
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
  hotTagText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 9,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
}); 