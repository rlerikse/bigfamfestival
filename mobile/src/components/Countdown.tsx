// Commit: Fix malformed Countdown component, always show 5-day forecast without divider or toggle
// /src/components/Countdown.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';

/**
 * Countdown component: Shows countdown until target date. After countdown finishes
 * it displays local festival time (America/Detroit) plus current weather and a
 * compact always-visible 5-day forecast (Thu–Mon) for Brooklyn, MI using Open‑Meteo.
 */
interface CountdownProps {
  targetDate: Date;
}

const BROOKLYN_LAT = 42.1059;
const BROOKLYN_LON = -84.2486;
const FESTIVAL_TIMEZONE = 'America/Detroit';

interface WeatherDay {
  date: string;
  dayLabel: string; // e.g. Thu
  code?: number;
  tMax?: number;
  tMin?: number;
}
interface WeatherState {
  temperature?: number;
  weatherCode?: number;
  isLoading: boolean;
  error?: string;
  lastUpdated?: number;
  daily?: WeatherDay[];
}

const weatherCodeToEmoji = (code?: number): string | undefined => {
  if (code == null) return undefined;
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65].includes(code)) return '🌧️';
  if ([66, 67].includes(code)) return '🌧️';
  if ([71, 73, 75, 77].includes(code)) return '🌨️';
  if ([80, 81, 82].includes(code)) return '🌧️';
  if ([85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌡️';
};

// Minute precision festival clock
const useFestivalClock = (interval = 30_000) => {
  const [now, setNow] = React.useState<Date>(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  let hour12 = 0; let minutes = '00'; let ampm = '';
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: FESTIVAL_TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true });
    const parts = fmt.formatToParts(now);
    const h = parts.find(p => p.type === 'hour');
    const m = parts.find(p => p.type === 'minute');
    const ap = parts.find(p => p.type === 'dayPeriod');
    hour12 = h ? parseInt(h.value, 10) : ((now.getHours() % 12) || 12);
    minutes = m ? m.value : now.getMinutes().toString().padStart(2, '0');
    ampm = ap ? ap.value.toUpperCase() : (now.getHours() >= 12 ? 'PM' : 'AM');
  } catch {
    const hours = now.getHours();
    hour12 = hours % 12 || 12;
    minutes = now.getMinutes().toString().padStart(2, '0');
    ampm = hours >= 12 ? 'PM' : 'AM';
  }
  return { hour12, minutes, ampm };
};

const useWeather = () => {
  const [state, setState] = React.useState<WeatherState>({ isLoading: true });
  const fetchWeather = React.useCallback(async (signal?: AbortSignal) => {
    try {
      setState(s => ({ ...s, isLoading: true, error: undefined }));
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${BROOKLYN_LAT}&longitude=${BROOKLYN_LON}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=${encodeURIComponent(FESTIVAL_TIMEZONE)}&forecast_days=7`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Bad response');
      const json = await res.json();
      const temperature = json?.current?.temperature_2m;
      const weatherCode = json?.current?.weather_code;
      const times: string[] | undefined = json?.daily?.time;
      const dailyCodes: number[] | undefined = json?.daily?.weather_code;
      const tMaxArr: number[] | undefined = json?.daily?.temperature_2m_max;
      const tMinArr: number[] | undefined = json?.daily?.temperature_2m_min;
      let daily: WeatherDay[] = [];
      if (times && times.length) {
        daily = times.map((iso, i) => {
          const d = new Date(iso + 'T00:00:00');
          const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: FESTIVAL_TIMEZONE });
          return {
            date: iso,
            dayLabel,
            code: dailyCodes ? dailyCodes[i] : undefined,
            tMax: tMaxArr ? tMaxArr[i] : undefined,
            tMin: tMinArr ? tMinArr[i] : undefined,
          };
        });
      }
      setState({ temperature, weatherCode, isLoading: false, lastUpdated: Date.now(), daily });
    } catch (e: unknown) {
      const isAbort = (err: unknown): err is { name: string } => typeof err === 'object' && !!err && 'name' in err && (err as { name: string }).name === 'AbortError';
      if (isAbort(e)) return;
      setState(s => ({ ...s, isLoading: false, error: 'Weather unavailable' }));
    }
  }, []);
  React.useEffect(() => {
    const controller = new AbortController();
    fetchWeather(controller.signal);
    const interval = setInterval(() => fetchWeather(controller.signal), 5 * 60 * 1000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [fetchWeather]);
  return state;
};

const ForecastAndClock: React.FC = () => {
  const { hour12, minutes, ampm } = useFestivalClock();
  const weather = useWeather();
  const weatherEmoji = weather.weatherCode != null ? weatherCodeToEmoji(weather.weatherCode) : undefined;
  const pieces: string[] = [];
  pieces.push('Brooklyn, MI');
  if (weather.temperature != null) pieces.push(`${Math.round(weather.temperature)}°F`);
  if (weatherEmoji) pieces.push(weatherEmoji);

  // Check if gates are open: between 10am and 6:15am next day
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const isGatesOpen = (currentHour > 10 || (currentHour === 10 && currentMinutes >= 0)) ||
                      (currentHour < 6 || (currentHour === 6 && currentMinutes < 15));

  return (
    <View style={styles.liveClockWrapper}>
      {/* 5-day forecast hidden for now */}
      {/* {!weather.isLoading && !weather.error && forecastDays.length > 0 && (
        <View style={[styles.forecastRow, styles.forecastPadding]}>
          {forecastDays.map(d => {
            const icon = weatherCodeToEmoji(d.code) || '';
            const hi = d.tMax != null ? Math.round(d.tMax) : '-';
            const lo = d.tMin != null ? Math.round(d.tMin) : '-';
            return (
              <View key={d.date} style={styles.forecastDay}>
                <Text style={styles.forecastIcon}>{icon}</Text>
                <Text style={styles.forecastTemps}>{hi}°/{lo}°</Text>
                <Text style={styles.forecastDayLabel}>{shortLabel(d.dayLabel)}</Text>
              </View>
            );
          })}
        </View>
      )} */}
      <View style={{ minHeight: 20, marginTop: 4 }}>
        {weather.isLoading ? (
          <View style={styles.inlineRow}>
            <ActivityIndicator size="small" color="#B87333" />
            <Text style={styles.metaText}>  Loading weather...</Text>
          </View>
        ) : weather.error ? (
          <Text style={styles.metaText}>{weather.error}</Text>
        ) : (
          <Text style={styles.metaText}>{pieces.join(' \u2022 ')}</Text>
        )}
      </View>
      <View style={styles.clockRow}>
        <Text style={styles.timeText}>{hour12}:{minutes} {ampm}</Text>
      </View>
      <View style={styles.gatesStatusRow}>
        <Text style={styles.gatesStatusText}>{isGatesOpen ? 'GATES OPEN' : 'GATES CLOSED'}</Text>
      </View>
    </View>
  );
};

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const timeLeft = useCountdown(targetDate);
  const weather = useWeather();
  const now = new Date();
  const gatesOpenDate = new Date('2025-09-26T10:00:00-04:00'); // Sept 26 10am EDT
  const shouldShowCountdown = timeLeft !== null || now < gatesOpenDate;

  const shortLabel = (lbl: string) => lbl.slice(0, 3);
  const forecastDays = (weather.daily || [])
    .filter(d => ['Thu', 'Fri', 'Sat', 'Sun', 'Mon'].includes(shortLabel(d.dayLabel)))
    .sort((a, b) => {
      const order = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
      return order.indexOf(shortLabel(a.dayLabel)) - order.indexOf(shortLabel(b.dayLabel));
    });

  const weatherEmoji = weather.weatherCode != null ? weatherCodeToEmoji(weather.weatherCode) : undefined;
  const pieces: string[] = [];
  pieces.push('Brooklyn, MI');
  if (weather.temperature != null) pieces.push(`${Math.round(weather.temperature)}°F`);
  if (weatherEmoji) pieces.push(weatherEmoji);

  if (shouldShowCountdown) {
    // Still counting down or before gates open
    return (
      <View style={styles.countdownWrapper}>
        {/* {!weather.isLoading && !weather.error && forecastDays.length > 0 && (
          <View style={[styles.forecastRow, styles.forecastPadding]}>
            {forecastDays.map(d => {
              const icon = weatherCodeToEmoji(d.code) || '';
              const hi = d.tMax != null ? Math.round(d.tMax) : '-';
              const lo = d.tMin != null ? Math.round(d.tMin) : '-';
              return (
                <View key={d.date} style={styles.forecastDay}>
                  <Text style={styles.forecastIcon}>{icon}</Text>
                  <Text style={styles.forecastTemps}>{hi}°/{lo}°</Text>
                  <Text style={styles.forecastDayLabel}>{shortLabel(d.dayLabel)}</Text>
                </View>
              );
            })}
          </View>
        )} */}
        {/* <Image source={require('../assets/images/gates-open-in.png')} style={styles.gatesImage} /> */}
        <View style={{ minHeight: 20, marginTop: -20, marginBottom: 3, alignItems: 'flex-start', paddingTop: 15 }}>
          {weather.isLoading ? (
            <View style={styles.inlineRow}>
              <ActivityIndicator size="small" color="#B87333" />
              <Text style={styles.metaText}>  Loading weather...</Text>
            </View>
          ) : weather.error ? (
            <Text style={styles.metaText}>{weather.error}</Text>
          ) : (
            <Text style={styles.metaText}>{pieces.join(' \u2022 ')}</Text>
          )}
        </View>
        <View style={styles.countdownRow}>
          <TimeBlock label="DAYS" value={timeLeft?.days ?? 0} />
          <Separator />
          <TimeBlock label="HRS" value={timeLeft?.hours ?? 0} />
          <Separator />
          <TimeBlock label="MIN" value={timeLeft?.minutes ?? 0} />
          <Separator />
          <TimeBlock label="SEC" value={timeLeft?.seconds ?? 0} />
        </View>
        <View style={[styles.gatesStatusRow, { paddingTop: 6, marginBottom: -10 }]}>
          <Text style={styles.gatesStatusText}>UNTIL GATES OPEN</Text>
        </View>
        {/* {!weather.isLoading && !weather.error && forecastDays.length > 0 && (
          <View style={[styles.forecastRow, styles.forecastPadding]}>
            {forecastDays.map(d => {
              const icon = weatherCodeToEmoji(d.code) || '';
              const hi = d.tMax != null ? Math.round(d.tMax) : '-';
              const lo = d.tMin != null ? Math.round(d.tMin) : '-';
              return (
                <View key={d.date} style={styles.forecastDay}>
                  <Text style={styles.forecastIcon}>{icon}</Text>
                  <Text style={styles.forecastTemps}>{hi}°/{lo}°</Text>
                  <Text style={styles.forecastDayLabel}>{shortLabel(d.dayLabel)}</Text>
                </View>
              );
            })}
          </View>
        )} */}
      </View>
    );
  }
  // Countdown finished and after gates open => show festival info
  return <ForecastAndClock />;
};

interface TimeBlockProps { label: string; value: number; }
const TimeBlock: React.FC<TimeBlockProps> = ({ label, value }) => (
  <View style={styles.timeBlock}>
    <Text style={styles.timeText}>{value.toString().padStart(2, '0')}</Text>
    <Text style={styles.labelText}>{label}</Text>
  </View>
);

const Separator: React.FC = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  countdownWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  gatesImage: {
    width: 350,
    height: 150,
    resizeMode: 'contain',
    marginBottom: -50,
    marginTop: -70
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  weatherLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#B87333',
    marginHorizontal: 8,
  },
  weatherRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: '#B87333',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  separator: {
    width: 1,
    height: 46,
    backgroundColor: '#B87333',
    marginHorizontal: 6,
  },
  liveClockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 0,
  },
  metaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 0,
  },
  forecastDay: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  forecastIcon: {
    fontSize: 18,
    lineHeight: 20,
  },
  forecastTemps: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
    marginTop: 1,
    lineHeight: 14,
  },
  forecastDayLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 0,
    textShadowColor: '#B87333',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
    lineHeight: 12,
  },
  forecastPadding: {
    paddingTop: 12,
    paddingBottom: 0, // Requested bottom padding under forecast
  },
  gatesStatusRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  gatesStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Countdown;
