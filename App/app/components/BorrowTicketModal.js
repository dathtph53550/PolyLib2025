import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createBorrowTicket, hideBorrowModal } from '../redux/slices/borrowTicketSlice';
import { useAuth } from '../context/AuthContext';

export default function BorrowTicketModal({ bookId }) {
  const dispatch = useDispatch();
  const { isModalVisible, loading, error, success } = useSelector(state => state.borrowTicket);
  const [note, setNote] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (success) {
      Alert.alert(
        "Thành công",
        "Tạo phiếu mượn sách thành công!",
        [{ text: "OK" }]
      );
      setNote('');
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      Alert.alert(
        "Lỗi",
        error,
        [{ text: "OK" }]
      );
    }
  }, [error]);

  const handleSubmit = () => {
    if (!user?.token) {
      Alert.alert(
        "Thông báo",
        "Vui lòng đăng nhập để mượn sách",
        [{ text: "OK" }]
      );
      return;
    }

    dispatch(createBorrowTicket({
      bookId,
      note: note.trim(),
      token: user.token
    }));
  };

  const handleClose = () => {
    setNote('');
    dispatch(hideBorrowModal());
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Mượn sách</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nhập ghi chú (không bắt buộc)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1A1B2E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#6B4EFF',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#E74C3C',
  },
}); 