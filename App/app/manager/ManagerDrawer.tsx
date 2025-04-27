import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import ProductManagerScreen from './ProductManagerScreen';
import CategoryManagerScreen from './CategoryManagerScreen';
import AccountManagerScreen from './AccountManagerScreen';
import RegistrationManagerScreen from './RegistrationManagerScreen';
import BorrowTicketManagerScreen from './BorrowTicketManagerScreen';
import ReturnTicketManagerScreen from './ReturnTicketManagerScreen';
import ReturnTicketStatsScreen from './ReturnTicketStatsScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content với nút đăng xuất
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Auth Context sẽ tự động chuyển hướng về login.tsx
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerDivider} />
      
      <View style={styles.userHeader}>
        <View style={styles.userAvatarContainer}>
          <Text style={styles.userAvatar}>{user?.fullname?.charAt(0) || 'A'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.fullname || 'Quản trị viên'}</Text>
          <Text style={styles.userRole}>Quản lý thư viện</Text>
        </View>
      </View>
      
      <View style={styles.drawerDivider} />
      
      <DrawerItemList {...props} />
      
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

export default function ManagerDrawer() {
  return (
    <Drawer.Navigator 
      initialRouteName="Quản Lý Sản Phẩm"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: '#FF753A',
        drawerActiveTintColor: '#FF753A',
        headerStyle: {
          backgroundColor: 'white',
          elevation: 1,
          shadowOpacity: 0.1,
        },
        drawerStyle: {
          backgroundColor: 'white',
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="Quản Lý Sản Phẩm" 
        component={ProductManagerScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="book-outline" size={22} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Quản Lý Danh Mục" 
        component={CategoryManagerScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="list-outline" size={22} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Quản Lý Tài Khoản" 
        component={AccountManagerScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Quản Lý Đăng Ký" 
        component={RegistrationManagerScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={22} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Quản Lý Phiếu Mượn" 
        component={BorrowTicketManagerScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={22} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Quản Lý Phiếu Trả" 
        component={ReturnTicketManagerScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="checkmark-circle-outline" size={22} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Thống Kê Doanh Thu" 
        component={ReturnTicketStatsScreen} 
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="bar-chart-outline" size={22} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 16,
    backgroundColor: '#FF753A',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 3,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  userHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF753A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutText: {
    marginLeft: 32,
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
});
