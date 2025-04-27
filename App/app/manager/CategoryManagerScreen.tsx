import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, addCategory, updateCategory, deleteCategory } from '../redux/slices/categoriesSlice';
import { useAuth } from '../context/AuthContext';

export default function CategoryManagerScreen() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const token = user?.token;
  const { categories, loading, error } = useSelector((state: any) => state.categories);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editCategory, setEditCategory] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', image: '' });

  useEffect(() => {
    if (token) {
      dispatch(fetchCategories(token) as any);
    }
  }, [dispatch, token]);

  const openAddModal = () => {
    setEditCategory(null);
    setForm({ name: '', image: '' });
    setModalVisible(true);
  };
  const openEditModal = (cat: any) => {
    setEditCategory(cat);
    setForm({ name: cat.name, image: cat.image || '' });
    setModalVisible(true);
  };
  const handleSave = () => {
    if (!form.name) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục!');
      return;
    }
    if (editCategory) {
      dispatch(updateCategory({ id: editCategory._id, name: form.name, image: form.image, token }) as any)
        .then(() => {
          dispatch(fetchCategories(token) as any);
          Alert.alert('Thành công', 'Cập nhật danh mục thành công!');
        });
    } else {
      dispatch(addCategory({ name: form.name, image: form.image, token }) as any)
        .then(() => {
          dispatch(fetchCategories(token) as any);
          Alert.alert('Thành công', 'Thêm danh mục thành công!');
        });
    }
    setModalVisible(false);
  };
  const handleDelete = (cat: any) => {
    Alert.alert('Xác nhận', `Xoá danh mục "${cat.name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => dispatch(deleteCategory({ id: cat._id, token }) as any) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản Lý Danh Mục</Text>
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên danh mục"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Link ảnh (URL)"
              value={form.image}
              onChangeText={text => setForm({ ...form, image: text })}
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
        <ActivityIndicator size="large" color="#FF9500" />
      ) : error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8, paddingHorizontal: 2 }}
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <Image
                source={{ uri: item.image || 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png' }}
                style={styles.categoryImage}
                resizeMode="cover"
              />
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.roundIconBtn}>
                  <Text style={{ color: '#FF9500', fontWeight: 'bold', fontSize: 15 }}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.roundIconBtn}>
                  <Text style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 15 }}>Xoá</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 18,
    backgroundColor: '#eee',
  },
  categoryName: {
    fontSize: 17,
    color: '#222',
    fontWeight: 'bold',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 18,
    backgroundColor: '#eee',
  },
  categoryName: {
    fontSize: 17,
    color: '#222',
    fontWeight: 'bold',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  roundIconBtn: {
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
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

