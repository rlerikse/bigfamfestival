import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';
import type { FestivalPhase } from '../hooks/useFestivalState';

/**
 * Countdown component: Shows countdown until target date.
 *
 * Behaviour:
 * - `upcoming`: show countdown digits + "UNTIL DOORS OPEN"
 * - `live`:     show live clock + "DOORS OPEN" (same as before, now phase-driven)
 * - `past`:     show neutral "LINEUP" heading so the app looks fine between festivals
 */
interface CountdownProps {
  targetDate: Date;
  /** Festival phase from useFestivalState. Defaults to time-based heuristic if omitted. */
  festivalPhase?: FestivalPhase;
}

import { festivalConfig } from '../config/festival.config';

const FESTIVAL_LAT = festivalConfig.location.latitude;
const FESTIVAL_LON = festivalConfig.location.longitude;
const FESTIVAL_TIMEZONE = festivalConfig.location.timezone;
const FESTIVAL_LOCATION_NAME = festivalConfig.location.name;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${FESTIVAL_LAT}&longitude=${FESTIVAL_LON}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=${encodeURIComponent(FESTIVAL_TIMEZONE)}&forecast_days=7`;
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
  const [expanded, setExpanded] = React.useState(false);
  const weatherEmoji = weather.weatherCode != null ? weatherCodeToEmoji(weather.weatherCode) : undefined;
  const pieces: string[] = [];
  pieces.push(FESTIVAL_LOCATION_NAME);
  if (weather.temperature != null) pieces.push(`${Math.round(weather.temperature)}°F`);
  if (weatherEmoji) pieces.push(weatherEmoji);

  const forecastDays = (weather.daily || []).slice(0, 5);

  const toggleForecast = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Check if doors are open: between 10am and 6:15am next day
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const isDoorsOpen = (currentHour > 10 || (currentHour === 10 && currentMinutes >= 0)) ||
                      (currentHour < 6 || (currentHour === 6 && currentMinutes < 15));

  return (
    <View style={styles.liveClockWrapper}>
      <TouchableOpacity onPress={toggleForecast} activeOpacity={0.7}>
        <View style={{ height: 20, alignItems: 'center', justifyContent: 'center' }}>
          {weather.isLoading ? (
            <Text style={styles.metaText}>{FESTIVAL_LOCATION_NAME}</Text>
          ) : weather.error ? (
            <Text style={styles.metaText}>{FESTIVAL_LOCATION_NAME}</Text>
          ) : (
            <Text style={styles.metaText}>{pieces.join(' \u2022 ')}</Text>
          )}
        </View>
      </TouchableOpacity>

      {expanded && !weather.isLoading && !weather.error && forecastDays.length > 0 && (
        <View style={styles.forecastContainer}>
          {forecastDays.map((d, i) => {
            const icon = weatherCodeToEmoji(d.code) || '☁️';
            const hi = d.tMax != null ? Math.round(d.tMax) : '-';
            const lo = d.tMin != null ? Math.round(d.tMin) : '-';
            return (
              <View key={d.date} style={[styles.forecastDayCard, i === 0 && styles.forecastDayCardToday]}>
                <Text style={styles.forecastDayLabel}>{i === 0 ? 'Today' : d.dayLabel}</Text>
                <Text style={styles.forecastIcon}>{icon}</Text>
                <View style={styles.forecastTempRow}>
                  <Text style={styles.forecastHi}>{hi}°</Text>
                  <Text style={styles.forecastLo}>{lo}°</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.clockRow}>
        <Text style={styles.timeText}>{hour12}:{minutes} {ampm}</Text>
      </View>
      <View style={styles.doorsStatusRow}>
        <Text style={styles.doorsStatusText}>{isDoorsOpen ? 'GATES OPEN' : 'GATES CLOSED'}</Text>
      </View>
    </View>
  );
};

const Countdown: React.FC<CountdownProps> = ({ targetDate, festivalPhase }) => {
  const timeLeft = useCountdown(targetDate);
  const weather = useWeather();
  const [expanded, setExpanded] = React.useState(false);
  const hasTimeLeft = timeLeft !== null && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0);

  const weatherEmoji = weather.weatherCode != null ? weatherCodeToEmoji(weather.weatherCode) : undefined;
  const weatherPieces: string[] = [FESTIVAL_LOCATION_NAME];
  if (weather.temperature != null) weatherPieces.push(`${Math.round(weather.temperature)}°F`);
  if (weatherEmoji) weatherPieces.push(weatherEmoji);

  const forecastDays = (weather.daily || []).slice(0, 5);

  const toggleForecast = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const weatherLine = (
    <View style={{ alignItems: "center", marginBottom: 6 }}>
      <TouchableOpacity onPress={toggleForecast} activeOpacity={0.7} style={{ height: 24, justifyContent: "center" }}>
        <View style={{ alignItems: 'center' }}>
          {weather.isLoading ? (
            <Text style={styles.metaText}>{FESTIVAL_LOCATION_NAME}</Text>
          ) : weather.error ? (
            <Text style={styles.metaText}>{FESTIVAL_LOCATION_NAME}</Text>
          ) : (
            <Text style={styles.metaText}>{weatherPieces.join(' \u2022 ')}</Text>
          )}
        </View>
      </TouchableOpacity>
      {expanded && !weather.isLoading && !weather.error && forecastDays.length > 0 && (
        <View style={styles.forecastContainer}>
          {forecastDays.map((d, i) => {
            const icon = weatherCodeToEmoji(d.code) || '☁️';
            const hi = d.tMax != null ? Math.round(d.tMax) : '-';
            const lo = d.tMin != null ? Math.round(d.tMin) : '-';
            return (
              <View key={d.date} style={[styles.forecastDayCard, i === 0 && styles.forecastDayCardToday]}>
                <Text style={styles.forecastDayLabel}>{i === 0 ? 'Today' : d.dayLabel}</Text>
                <Text style={styles.forecastIcon}>{icon}</Text>
                <View style={styles.forecastTempRow}>
                  <Text style={styles.forecastHi}>{hi}°</Text>
                  <Text style={styles.forecastLo}>{lo}°</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  // Phase-driven rendering:
  // 1. If festivalPhase is provided, trust it as source of truth.
  // 2. Otherwise fall back to time-based heuristic (hasTimeLeft).
  const effectivePhase: FestivalPhase = festivalPhase ??
    (hasTimeLeft ? 'upcoming' : 'live');

  if (effectivePhase === 'past') {
    return (
      <View style={styles.countdownWrapper}>
        {weatherLine}
        <View style={styles.clockRow}>
          <Text style={styles.timeText}>BIG FAM</Text>
        </View>
        <View style={[styles.doorsStatusRow, { paddingTop: 6 }]}>
          <Text style={styles.doorsStatusText}>FESTIVAL</Text>
        </View>
      </View>
    );
  }

  if (effectivePhase === 'live') {
    return (
      <View style={styles.countdownWrapper}>
        {weatherLine}
        <View style={styles.clockRow}>
          <Text style={styles.timeText}>GATES OPEN</Text>
        </View>
        <View style={[styles.doorsStatusRow, { paddingTop: 6 }]}>
          <Text style={styles.doorsStatusText}>8:00 PM</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.countdownWrapper}>
      {weatherLine}
      <View style={styles.countdownRow}>
        <TimeBlock label="DAYS" value={timeLeft?.days ?? 0} />
        <Separator />
        <TimeBlock label="HRS" value={timeLeft?.hours ?? 0} />
        <Separator />
        <TimeBlock label="MIN" value={timeLeft?.minutes ?? 0} />
        <Separator />
        <TimeBlock label="SEC" value={timeLeft?.seconds ?? 0} />
      </View>
      <View style={[styles.doorsStatusRow, { paddingTop: 6, marginBottom: -10 }]}>
        <Text style={styles.doorsStatusText}>UNTIL GATES OPEN</Text>
      </View>
    </View>
  );
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
  doorsImage: {
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
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 4,
    gap: 8,
  },
  forecastDayCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    width: 56,
  },
  forecastDayCardToday: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  forecastTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  forecastHi: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  forecastLo: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
  },
  forecastDay: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  forecastIcon: {
    fontSize: 18,
    lineHeight: 22,
    marginVertical: 2,
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
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  expandArrow: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  forecastPadding: {
    paddingTop: 12,
    paddingBottom: 0, // Requested bottom padding under forecast
  },
  doorsStatusRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  doorsStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Countdown;
