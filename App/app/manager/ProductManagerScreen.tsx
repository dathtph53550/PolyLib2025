import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView , TextInput} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBooks, deleteBook, updateBook, addBook } from '../redux/slices/booksSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import store from '../redux/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import { useState } from 'react';

export default function ProductManagerScreen() {
  const dispatch = useDispatch();
  const { books, loading, error } = useSelector((state) => state.books);
  const { categories } = useSelector((state: any) => state.categories);
  const { user } = useAuth();
  const token = user?.token;

  const [modalVisible, setModalVisible] = useState(false);
  const [editBook, setEditBook] = useState(null); // null = add, else = edit
  const [form, setForm] = useState({
    title: '',
    author: '',
    image: '',
    category: '', // sẽ là id
    publisher: '',
    rentalPrice: '',
    quantity: '',
    description: '',
  });

  useEffect(() => {
    if (token) {
      dispatch(fetchBooks(token) as any);
      dispatch(fetchCategories(token) as any);
    }
  }, [dispatch, token]);

  const openAddModal = () => {
    setEditBook(null);
    setForm({
      title: '',
      author: '',
      image: '',
      category: '',
      publisher: '',
      rentalPrice: '',
      quantity: '',
      description: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (book) => {
    setEditBook(book);
    setForm({
      title: book.title,
      author: book.author,
      image: book.image,
      category: (typeof book.category === 'object' && book.category?._id) ? book.category._id : (typeof book.category === 'string' ? book.category : ''),
      publisher: book.publisher || '',
      rentalPrice: book.rentalPrice ? String(book.rentalPrice) : '',
      quantity: book.quantity ? String(book.quantity) : '',
      description: book.description,
    });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xoá sách này?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => dispatch(deleteBook({ id, token }) as any) },
    ]);
  };

  const handleSave = () => {
    if (!form.title || !form.author || !form.category) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    const bookPayload = {
      title: form.title,
      category: form.category, // id string
      author: form.author,
      publisher: form.publisher,
      rentalPrice: Number(form.rentalPrice),
      quantity: Number(form.quantity),
      description: form.description,
      image: form.image,
    };
    console.log('BOOK PAYLOAD:', bookPayload); // DEBUG
    if (editBook) {
      dispatch(updateBook({ id: editBook._id, book: bookPayload, token }) as any);
    } else {
      dispatch(addBook({ ...bookPayload, token }) as any);
    }
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookCard}>
      <Image source={{ uri: item.image }} style={styles.bookImage} />
      <View style={{ flex: 1 }}>
        <View style={styles.bookHeader}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          {typeof item.category === 'object' && item.category?.name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {item.category.name}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        
        <View style={styles.bookInfoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag" size={16} color="#3498db" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Giá: </Text>
              <Text style={styles.priceValue}>{item.rentalPrice?.toLocaleString() || 0}đ</Text>
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="cube" size={16} color="#2ecc71" />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>SL: </Text>
              <Text style={styles.quantityValue}>{item.quantity || 0}</Text>
            </Text>
          </View>
        </View>
        
        <Text style={styles.bookDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.roundIconBtn}>
            <Ionicons name="pencil" size={20} color="#FF9500" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.roundIconBtn}>
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal thêm/sửa sách */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editBook ? 'Sửa sách' : 'Thêm sách mới'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={form.title}
              onChangeText={text => setForm({ ...form, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Tác giả"
              value={form.author}
              onChangeText={text => setForm({ ...form, author: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Link ảnh (URL)"
              value={form.image}
              onChangeText={text => setForm({ ...form, image: text })}
            />
            {/* Dropdown chọn thể loại */}
            <View style={[styles.input, { padding: 0, minHeight: 48 }]}> 
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      backgroundColor: form.category === item._id ? '#FF9500' : '#eee',
                      borderRadius: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      marginRight: 8,
                    }}
                    onPress={() => setForm({ ...form, category: item._id })}
                  >
                    <Text style={{ color: form.category === item._id ? '#fff' : '#333', fontWeight: 'bold' }}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nhà xuất bản"
              value={form.publisher}
              onChangeText={text => setForm({ ...form, publisher: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Giá thuê"
              value={form.rentalPrice}
              onChangeText={text => setForm({ ...form, rentalPrice: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Số lượng"
              value={form.quantity}
              onChangeText={text => setForm({ ...form, quantity: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Mô tả"
              value={form.description}
              onChangeText={text => setForm({ ...form, description: text })}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#666' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF9500' }]} onPress={handleSave}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {loading ? (
        <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>
      ) : books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={60} color="#ccc" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#888', fontSize: 16 }}>Chưa có sách nào.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8, paddingHorizontal: 2 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 0,
  },
  addBtn: {
    backgroundColor: '#FF9500',
    borderRadius: 24,
    padding: 8,
    elevation: 3,
    shadowColor: '#FF9500',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 34,
    backgroundColor: '#FF9500',
    borderRadius: 32,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#FF9500',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginHorizontal: 10,
  },
  bookImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
    marginRight: 18,
    backgroundColor: '#eee',
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
    flex: 1,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookInfoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 13,
  },
  infoLabel: {
    fontWeight: '500',
    color: '#555',
  },
  priceValue: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  quantityValue: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  bookDesc: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  roundIconBtn: {
    backgroundColor: '#f3f3f3',
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  modalOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalContent: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: '#eee',
  },
});
