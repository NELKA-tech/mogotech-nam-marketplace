import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import client from '../api/client';

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = useState('SUPPLY'); // SUPPLY = Sellers, DEMAND = Buyer Wanted Ads
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const fetchListings = async () => {
    try {
      const res = await client.get(`/listings?type=${activeTab}`);
      setListings(res.data.listings);
    } catch (err) {
      console.error(err);
    }
  };

  const openWhatsApp = (phone, title) => {
    const text = encodeURIComponent(`Hello! I saw your post on MogoTech Marketplace: "${title}". Is this still available?`);
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'SUPPLY' && styles.activeTab]}
          onPress={() => setActiveTab('SUPPLY')}
        >
          <Text style={[styles.tabText, activeTab === 'SUPPLY' && styles.activeTabText]}>Businesses / Sellers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'DEMAND' && styles.activeTab]}
          onPress={() => setActiveTab('DEMAND')}
        >
          <Text style={[styles.tabText, activeTab === 'DEMAND' && styles.activeTabText]}>Looking to Buy (Wanted)</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.category}>{item.category.toUpperCase()} • {item.town}, {item.region}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            {item.price_nad && <Text style={styles.price}>N$ {item.price_nad}</Text>}

            <TouchableOpacity
              style={styles.waButton}
              onPress={() => openWhatsApp(item.contact_whatsapp, item.title)}
            >
              <Text style={styles.waButtonText}>Chat on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#0072C6' },
  tabText: { color: '#6C757D', fontWeight: 'bold' },
  activeTabText: { color: '#0072C6' },
  card: { backgroundColor: '#FFF', padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: 8 },
  category: { fontSize: 11, color: '#6C757D', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#212529', marginVertical: 4 },
  description: { fontSize: 14, color: '#495057', marginBottom: 8 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#28A745', marginBottom: 12 },
  waButton: { backgroundColor: '#25D366', padding: 10, borderRadius: 6, alignItems: 'center' },
  waButtonText: { color: '#FFF', fontWeight: 'bold' }
});