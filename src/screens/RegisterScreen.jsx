import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import client from '../api/client';

export default function RegisterScreen({ onVerified }) {
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [region, setRegion] = useState('Khomas');
  const [town, setTown] = useState('Windhoek');
  
  const [pendingVerification, setPendingVerification] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Clean digits and format to local 081...
  const formatPhoneNumber = (num) => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('264')) {
      cleaned = '0' + cleaned.slice(3);
    }
    return cleaned;
  };

  // Validate exact 10-digit Namibian mobile number
  const validateClientPhone = (num) => {
    const cleaned = formatPhoneNumber(num);
    const validPrefixes = ['081', '083', '084', '085'];
    return cleaned.length === 10 && validPrefixes.some(prefix => cleaned.startsWith(prefix));
  };

  const handleRegister = async () => {
    if (!validateClientPhone(phone)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Namibian phone number (e.g., 081 123 4567).');
      return;
    }

    const cleanPhone = formatPhoneNumber(phone);

    try {
      const res = await client.post('/auth/register', { 
        phone: cleanPhone, 
        businessName, 
        region, 
        town 
      });
      setPendingVerification(res.data);
      setIsPolling(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed.');
    }
  };

  const triggerSMSApp = () => {
    if (!pendingVerification) return;
    const { receiverNumber, verificationCode } = pendingVerification;
    const body = encodeURIComponent(`VERIFY ${verificationCode}`);
    
    // Use & for iOS and ? for Android SMS body separator
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const smsUrl = `sms:${receiverNumber}${separator}body=${body}`;

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Unable to open native SMS app.');
    });
  };

  // Poll server every 3s to detect auto-verification after SMS sent
  useEffect(() => {
    let timer;
    if (isPolling && pendingVerification) {
      const targetPhone = pendingVerification.phone || formatPhoneNumber(phone);
      timer = setInterval(async () => {
        try {
          const res = await client.get(`/auth/verification-status?phone=${encodeURIComponent(targetPhone)}`);
          if (res.data.verified) {
            clearInterval(timer);
            setIsPolling(false);
            Alert.alert('Success', 'Namibian Phone Number Verified!');
            onVerified(res.data.token);
          }
        } catch (e) {
          console.log('Polling check...');
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPolling, pendingVerification]);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Nam Marketplace</Text>
      <Text style={styles.subtitle}>Buy and Sell Market for Namibian Traders (+264)</Text>

      {!pendingVerification ? (
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
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Continue to Verification</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.verifyBox}>
          <Text style={styles.infoText}>
            Tap below to send a free verification text using your MTC / TN Mobile Aweh bundle.
          </Text>
          <TouchableOpacity style={styles.smsButton} onPress={triggerSMSApp}>
            <Text style={styles.buttonText}>Verify via SMS (N$ 0.00)</Text>
          </TouchableOpacity>

          {isPolling && (
            <View style={styles.pollingContainer}>
              <ActivityIndicator size="small" color="#0072C6" />
              <Text style={styles.pollingText}>Awaiting SMS verification from +264 network...</Text>
            </View>
          )}
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
  button: { backgroundColor: '#0072C6', padding: 16, borderRadius: 8, alignItems: 'center' },
  smsButton: { backgroundColor: '#28A745', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 16 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  verifyBox: { alignItems: 'center' },
  infoText: { textAlign: 'center', fontSize: 15, color: '#333', lineHeight: 22 },
  pollingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  pollingText: { marginLeft: 10, color: '#6C757D', fontSize: 13 }
});