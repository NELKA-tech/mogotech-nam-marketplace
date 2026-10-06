import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import client from '../api/client';

export default function RegisterScreen({ onVerified }) {
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [town, setTown] = useState('Windhoek');
  
  const [confirmResult, setConfirmResult] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Format local phone (081...) to international +264...
  const formatInternationalPhone = (num) => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '264' + cleaned.slice(1);
    }
    return '+' + cleaned;
  };

  // Step 1: Send SMS OTP via Firebase
  const handleSendOTP = async () => {
    const fullPhone = formatInternationalPhone(phone);

    if (fullPhone.length < 12) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Namibian number (e.g., 081 123 4567).');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      setConfirmResult(confirmation);
      Alert.alert('SMS Sent', `Verification code sent to ${fullPhone}`);
    } catch (error) {
      Alert.alert('Firebase Error', error.message || 'Failed to send SMS code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP & Save User to Supabase Backend
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Required', 'Please enter the 6-digit code received via SMS.');
      return;
    }

    setLoading(true);
    try {
      // Confirm OTP code with Firebase
      const userCredential = await confirmResult.confirm(otpCode);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // Send token and profile details to backend
      const res = await client.post('/auth/firebase-register', {
        idToken,
        phone: formatInternationalPhone(phone),
        businessName,
        town,
      });

      Alert.alert('Success', 'Phone Number Verified!');
      onVerified(res.data.token);
    } catch (error) {
      Alert.alert('Verification Failed', 'Invalid or expired SMS code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Nam Marketplace</Text>
      <Text style={styles.subtitle}>Buy and Sell Market for Namibian Traders (+264)</Text>

      {!confirmResult ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number (e.g., 081 123 4567)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="Business Name (or Individual)"
            value={businessName}
            onChangeText={setBusinessName}
          />
          <TextInput
            style={styles.input}
            placeholder="Town (e.g., Windhoek, Walvis Bay)"
            value={town}
            onChangeText={setTown}
          />
          <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send SMS Code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.verifyBox}>
          <Text style={styles.infoText}>Enter the 6-digit SMS code sent to your phone:</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            value={otpCode}
            onChangeText={setOtpCode}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify & Complete Registration</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F8F9FA' },
  brand: { fontSize: 28, fontWeight: 'bold', color: '#0072C6', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6C757D', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CED4DA', padding: 14, borderRadius: 8, marginBottom: 16 },
  button: { backgroundColor: '#0072C6', padding: 16, borderRadius: 8, alignItems: 'center', width: '100%' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  verifyBox: { alignItems: 'center', width: '100%' },
  infoText: { textAlign: 'center', fontSize: 15, color: '#333', marginBottom: 16 },
  codeInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CED4DA', padding: 14, borderRadius: 8, marginBottom: 16, textAlign: 'center', fontSize: 22, letterSpacing: 6, width: '100%' },
});