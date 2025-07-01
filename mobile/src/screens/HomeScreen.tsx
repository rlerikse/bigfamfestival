import React from 'react';
import {
  View,
  Text,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }}>
      <Image
        source={{ uri: 'https://img.icons8.com/color/96/000000/under-construction.png' }}
        style={{ width: 96, height: 96, marginBottom: 24 }}
      />
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
        Under Construction
      </Text>
      <Text style={{ color: '#aaa', fontSize: 16, textAlign: 'center', maxWidth: 280 }}>
        The Home screen is being rebuilt. Please use the Schedule tab for now.
      </Text>
      <Ionicons name="construct" size={48} color="#FFD600" style={{ marginTop: 24 }} />
    </View>
  );
};

export default HomeScreen;