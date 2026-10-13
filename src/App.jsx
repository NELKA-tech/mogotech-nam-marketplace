import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import RegisterScreen from './screens/RegisterScreen';
import MarketplaceScreen from './screens/MarketplaceScreen';

export default function App() {
  const [authToken, setAuthToken] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {authToken ? (
        <MarketplaceScreen />
      ) : (
        <RegisterScreen onVerified={(token) => setAuthToken(token)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
});