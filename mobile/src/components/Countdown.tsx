// /src/components/Countdown.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownProps {
  targetDate: Date;
  onFinish?: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, onFinish }) => {
  const timeLeft = useCountdown(targetDate, onFinish);

  if (!timeLeft) {
    return (
      <View style={styles.container}>
        <Text style={styles.finishedText}>Welcome to Big Fam!</Text>
      </View>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>{timeLeft.days}</Text>
        <Text style={styles.labelText}>DAYS</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>{formatNumber(timeLeft.hours)}</Text>
        <Text style={styles.labelText}>HRS</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>{formatNumber(timeLeft.minutes)}</Text>
        <Text style={styles.labelText}>MIN</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>{formatNumber(timeLeft.seconds)}</Text>
        <Text style={styles.labelText}>SEC</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSection: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timeText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono-Regular', // Assuming SpaceMono is loaded
    // Create a more pronounced copper outline effect
    textShadowColor: '#B87333', // Copper outline color
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    // Note: We can't add multiple shadows in React Native directly,
    // but we can use a slightly increased radius for a thicker appearance
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: '#B87333', // Copper outline color
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  separator: {
    width: 1,
    height: 50,
    backgroundColor: '#B87333', // Updated to match copper color
    marginHorizontal: 5,
  },
  finishedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#B87333', // Copper outline color
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default Countdown;
