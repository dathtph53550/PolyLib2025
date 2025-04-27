import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts } from '../redux/slices/accountsSlice';
import { useSelector as useTypedSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';

export default function AccountManagerScreen() {
  const dispatch = useDispatch();
  const { accounts, loading, error } = useSelector((state) => state.accounts);
  const { user } = useAuth();
  const token = user?.token;

  useEffect(() => {
    console.log('TOKEN in AccountManagerScreen:', token);
    if (!token) {
      console.warn('Không tìm thấy token! Không thể fetch accounts.');
      return;
    }
    dispatch(fetchAccounts(token));
  }, [token]);

  // Hàm cập nhật account
  const updateAccount = async (id, data, token, onSuccess) => {
    try {
      await axios.put(`http://localhost:3000/api/users/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Cập nhật thất bại!');
    }
  };

  const renderItem = ({ item }) => {
    let roleText = 'Khách';
    if (item.role === 1) roleText = 'Nhân Viên';
    else if (item.role === 2) roleText = 'Admin';
    const statusText = item.status === 1 ? 'Hoạt động' : 'Khoá';
    const statusColor = item.status === 1 ? '#4CD964' : '#FF3B30';

    // Xử lý đổi role: chỉ cho phép Khách (0) <-> Nhân Viên (1)
    const handleChangeRole = () => {
      const newRole = item.role === 1 ? 0 : 1;
      updateAccount(item._id, { role: newRole }, token, () => dispatch(fetchAccounts(token)));
    };

    // Xử lý đổi status
    const handleChangeStatus = () => {
      const newStatus = item.status === 1 ? 0 : 1;
      updateAccount(item._id, { status: newStatus }, token, () => dispatch(fetchAccounts(token)));
    };

    return (
      <View style={styles.card}>
        {/* Username & Status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={styles.username}><Text style={styles.usernameIcon}>👤 </Text>{item.username}</Text>
          <Text style={[styles.status, { backgroundColor: statusColor }]}>{statusText}</Text>
        </View>
        {/* Fullname */}
        <Text style={styles.fullname}><Text style={styles.fullnameLabel}>Họ tên: </Text>{item.fullname}</Text>
        {/* Email & Phone */}
        <View style={styles.row}><Text style={styles.icon}>✉️</Text><Text style={styles.infoText}>{item.email}</Text></View>
        <View style={styles.row}><Text style={styles.icon}>📞</Text><Text style={styles.infoText}>{item.phone || '---'}</Text></View>
        {/* Role + Button */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.role}>Quyền: <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>{roleText}</Text></Text>
          {item.role !== 2 && (
            <View style={styles.actionBtnGroup}>
              <TouchableOpacity style={styles.btnChangeRole} onPress={handleChangeRole}>
                <Text style={styles.btnText}><Text style={{fontSize:16}}>🔄</Text> Đổi quyền</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnChangeStatus, {backgroundColor: item.status === 1 ? '#FF3B30' : '#4CD964'}]} onPress={handleChangeStatus}>
                <Text style={styles.btnText}>
                  {item.status === 1 ? <Text style={{fontSize:16}}>⛔</Text> : <Text style={{fontSize:16}}>✅</Text>} Đổi trạng thái
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };




  // Debug log
  console.log('ACCOUNTS STATE:', accounts);

  // Đảm bảo FlatList luôn nhận được mảng
  let accountsArray = Array.isArray(accounts) ? accounts : [];
  if (!Array.isArray(accounts)) {
    console.warn('accounts không phải mảng:', accounts);
  }

  // State cho ô tìm kiếm
  const [searchText, setSearchText] = React.useState('');

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={{fontSize:18, marginRight:4}}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập username để tìm..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#aaa"
        />
      </View>
      {loading && <ActivityIndicator color="#FF9500" />}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <FlatList
        data={accountsArray.filter(acc => acc.username !== 'admin' && acc.username.toLowerCase().includes(searchText.toLowerCase()))}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={!loading && <Text style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>Không có tài khoản nào.</Text>}
      />
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
    marginBottom: 10,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
    marginHorizontal: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f2f2f2',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 19,
    color: '#FF9500',
    marginRight: 10,
    marginBottom: 2,
  },
  usernameIcon: {
    fontSize: 17,
    marginRight: 2,
  },
  fullname: {
    fontSize: 16,
    color: '#222',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  fullnameLabel: {
    color: '#888',
    fontWeight: '400',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  icon: {
    marginRight: 6,
    fontSize: 15,
  },
  infoText: {
    fontSize: 15,
    color: '#444',
  },
  role: {
    marginTop: 8,
    fontSize: 14,
    color: '#222',
  },
  status: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
    overflow: 'hidden',
    fontWeight: 'bold',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  btnChangeRole: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    minWidth: 100,
    shadowColor: '#FF9500',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btnChangeStatus: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
