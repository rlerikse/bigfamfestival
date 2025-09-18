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
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  separator: {
    width: 1,
    height: 50,
    backgroundColor: '#D2B48C', // Copper color from theme
    marginHorizontal: 5,
  },
  finishedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Countdown;
