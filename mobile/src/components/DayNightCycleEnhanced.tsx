import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height: screenHeight } = Dimensions.get('window');

interface DayNightCycleProps {
  height: number;
}

const DayNightCycle: React.FC<DayNightCycleProps> = ({ height }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [starOpacity] = useState(new Animated.Value(0));
  const [sunGlow] = useState(new Animated.Value(0));
  const [moonGlow] = useState(new Animated.Value(0));
  const [horizonGlow] = useState(new Animated.Value(0));
  const [auroraOpacity] = useState(new Animated.Value(0));
  
  // Multiple cloud layers for depth
  const [cloudLayer1] = useState(new Animated.Value(0));
  const [cloudLayer2] = useState(new Animated.Value(0.3));
  const [cloudLayer3] = useState(new Animated.Value(0.7));
  
  const starTwinkleRefs = useRef<Animated.Value[]>([]);
  const auroraAnimRef = useRef<Animated.Value>(new Animated.Value(0));

  // Initialize all animations
  useEffect(() => {
    // Initialize star twinkle animations (more realistic with varying intensity)
    starTwinkleRefs.current = Array.from({ length: 100 }, () => new Animated.Value(Math.random()));
    
    // Start enhanced twinkling animation
    const twinkleAnimations = starTwinkleRefs.current.map((ref, index) => {
      const delay = Math.random() * 3000; // Stagger the animations
      const minOpacity = index % 3 === 0 ? 0.8 : 0.3; // Some stars are brighter
      const maxOpacity = index % 3 === 0 ? 1 : 0.7;
      
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(ref, {
            toValue: maxOpacity,
            duration: 1500 + Math.random() * 3000,
            useNativeDriver: false,
          }),
          Animated.timing(ref, {
            toValue: minOpacity,
            duration: 1500 + Math.random() * 3000,
            useNativeDriver: false,
          }),
        ])
      );
    });

    twinkleAnimations.forEach(animation => animation.start());

    // Aurora animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(auroraAnimRef.current, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
        }),
        Animated.timing(auroraAnimRef.current, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => twinkleAnimations.forEach(animation => animation.stop());
  }, []);

  // Enhanced cloud animations with different speeds and directions
  useEffect(() => {
    // Layer 1 - Fast moving high clouds
    Animated.loop(
      Animated.timing(cloudLayer1, {
        toValue: 1,
        duration: 45000, // 45 seconds
        useNativeDriver: false,
      })
    ).start();

    // Layer 2 - Medium speed medium clouds
    Animated.loop(
      Animated.timing(cloudLayer2, {
        toValue: 1,
        duration: 75000, // 75 seconds
        useNativeDriver: false,
      })
    ).start();

    // Layer 3 - Slow moving low clouds
    Animated.loop(
      Animated.timing(cloudLayer3, {
        toValue: 1,
        duration: 120000, // 2 minutes
        useNativeDriver: false,
      })
    ).start();
  }, [cloudLayer1, cloudLayer2, cloudLayer3]);

  // Update time every 10 seconds for smoother transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds for very smooth transitions

    return () => clearInterval(interval);
  }, []);

  // Enhanced time-based values with more granular periods
  const getTimeValues = React.useCallback(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeDecimal = hours + minutes / 60;

    // More nuanced time periods for realistic transitions
    const isDeepNight = timeDecimal < 4 || timeDecimal >= 22;
    const isPreDawn = timeDecimal >= 4 && timeDecimal < 5.5;
    const isDawn = timeDecimal >= 5.5 && timeDecimal < 7;
    const isMorning = timeDecimal >= 7 && timeDecimal < 10;
    const isMidday = timeDecimal >= 10 && timeDecimal < 14;
    const isAfternoon = timeDecimal >= 14 && timeDecimal < 17;
    const isGoldenHour = timeDecimal >= 17 && timeDecimal < 18.5;
    const isSunset = timeDecimal >= 18.5 && timeDecimal < 20;
    const isDusk = timeDecimal >= 20 && timeDecimal < 22;

    const isNight = isDeepNight || isPreDawn;
    const isDay = isMorning || isMidday || isAfternoon;

    return { 
      timeDecimal, 
      isDeepNight, isPreDawn, isDawn, isMorning, isMidday, 
      isAfternoon, isGoldenHour, isSunset, isDusk,
      isNight, isDay 
    };
  }, [currentTime]);

  // Enhanced sky gradient with realistic color temperature and atmospheric effects
  const getSkyGradient = (): [string, string, ...string[]] => {
    const { isDeepNight, isPreDawn, isDawn, isMorning, isMidday, isAfternoon, isGoldenHour, isSunset, isDusk } = getTimeValues();

    if (isDeepNight) {
      return ['#0a0a1a', '#1a1a3a', '#2d2d4a']; // Deep space black to navy
    } else if (isPreDawn) {
      return ['#1a1a3a', '#2d2d4a', '#4a4a6a']; // Pre-dawn transition
    } else if (isDawn) {
      return ['#ff6b35', '#ff8c42', '#ffd23f', '#87ceeb']; // Dawn colors
    } else if (isMorning) {
      return ['#87ceeb', '#add8e6', '#e0f6ff']; // Morning blues
    } else if (isMidday) {
      return ['#4da6ff', '#87ceeb', '#b3e5fc']; // Bright midday
    } else if (isAfternoon) {
      return ['#6bb6ff', '#87ceeb', '#add8e6']; // Afternoon blue
    } else if (isGoldenHour) {
      return ['#ff7f50', '#ffb347', '#ffd700', '#87ceeb']; // Golden hour magic
    } else if (isSunset) {
      return ['#ff1744', '#ff5722', '#ff9800', '#ffb347']; // Dramatic sunset
    } else if (isDusk) {
      return ['#3f51b5', '#5c6bc0', '#7986cb']; // Purple dusk
    }
    
    // Default fallback
    return ['#87ceeb', '#add8e6', '#e0f6ff'];
  };

  // More realistic celestial body positioning with atmospheric effects
  const getCelestialPositions = () => {
    const { timeDecimal } = getTimeValues();
    
    // Enhanced sun arc calculation (rises at 6 AM, sets at 6 PM)
    const sunDayLength = 12; // 12 hours of daylight
    const sunStartHour = 6;
    const sunProgress = Math.max(0, Math.min(1, (timeDecimal - sunStartHour) / sunDayLength));
    
    // More realistic arc - sun follows a parabolic path
    const sunAngle = sunProgress * Math.PI;
    const sunX = width * sunProgress;
    const sunY = height * 0.1 + (height * 0.4 * (1 - Math.sin(sunAngle))) + Math.cos(sunAngle * 2) * 5; // Add slight wobble
    
    // Enhanced moon calculation with realistic lunar arc
    let moonProgress = 0;
    if (timeDecimal >= 20) {
      moonProgress = (timeDecimal - 20) / 10; // 8 PM to 6 AM (10 hours)
    } else if (timeDecimal < 6) {
      moonProgress = (timeDecimal + 4) / 10; // Continue from previous night
    }
    moonProgress = Math.max(0, Math.min(1, moonProgress));
    
    const moonAngle = moonProgress * Math.PI;
    const moonX = width * moonProgress;
    const moonY = height * 0.05 + (height * 0.35 * (1 - Math.sin(moonAngle))) + Math.sin(moonAngle * 3) * 3; // Add lunar wobble

    // Calculate atmospheric effects
    const atmosphericDistortion = Math.sin(timeDecimal * Math.PI / 12) * 2;

    return { 
      sunX: sunX + atmosphericDistortion, 
      sunY: sunY + atmosphericDistortion, 
      moonX: moonX - atmosphericDistortion, 
      moonY: moonY - atmosphericDistortion
    };
  };

  // Animate celestial bodies and atmospheric effects
  useEffect(() => {
    const timeValues = getTimeValues();
    const { isNight, isDay, isGoldenHour, isSunset, isDawn } = timeValues;

    Animated.parallel([
      // Stars fade in/out
      Animated.timing(starOpacity, {
        toValue: isNight ? 1 : 0,
        duration: 3000,
        useNativeDriver: false,
      }),
      // Sun glow effect
      Animated.timing(sunGlow, {
        toValue: (isDay || isGoldenHour || isSunset || isDawn) ? 1 : 0,
        duration: 2000,
        useNativeDriver: false,
      }),
      // Moon glow effect
      Animated.timing(moonGlow, {
        toValue: isNight ? 1 : 0,
        duration: 2000,
        useNativeDriver: false,
      }),
      // Horizon atmospheric glow
      Animated.timing(horizonGlow, {
        toValue: (isGoldenHour || isSunset || isDawn) ? 1 : 0,
        duration: 2000,
        useNativeDriver: false,
      }),
      // Aurora effect (only during deep night)
      Animated.timing(auroraOpacity, {
        toValue: timeValues.isDeepNight ? 0.6 : 0,
        duration: 4000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentTime, starOpacity, sunGlow, moonGlow, horizonGlow, auroraOpacity, getTimeValues]);

  const { sunX, sunY, moonX, moonY } = getCelestialPositions();
  const { isNight, isDay, isDawn, isSunset, isGoldenHour, isDeepNight } = getTimeValues();

  // Enhanced star field with constellation patterns
  const generateStars = () => {
    const stars = [];
    
    // Major stars (brighter, larger)
    for (let i = 0; i < 25; i++) {
      stars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * (height * 0.6),
        size: Math.random() * 1.5 + 1,
        brightness: 0.8 + Math.random() * 0.2,
        type: 'major'
      });
    }
    
    // Minor stars (dimmer, smaller)
    for (let i = 25; i < 100; i++) {
      stars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * (height * 0.7),
        size: Math.random() * 1 + 0.3,
        brightness: 0.3 + Math.random() * 0.4,
        type: 'minor'
      });
    }
    
    return stars;
  };

  const stars = generateStars();

  // Generate aurora waves
  const generateAuroraWaves = () => {
    const waves = [];
    for (let i = 0; i < 5; i++) {
      waves.push({
        id: i,
        baseY: height * 0.1 + i * 15,
        amplitude: 20 + Math.random() * 30,
        frequency: 0.02 + Math.random() * 0.01,
        color: i % 2 === 0 ? '#00ff88' : '#0088ff',
        opacity: 0.3 + Math.random() * 0.4
      });
    }
    return waves;
  };

  const auroraWaves = generateAuroraWaves();

  return (
    <View style={{ height, width, position: 'relative', overflow: 'hidden' }}>
      {/* Sky Background Gradient with enhanced realism */}
      <LinearGradient
        colors={getSkyGradient()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Horizon Atmospheric Glow */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: height * 0.3,
          opacity: horizonGlow,
        }}
      >
        <LinearGradient
          colors={['transparent', isGoldenHour ? '#ffd700' : (isSunset ? '#ff4500' : '#ff8c00'), 'transparent']}
          style={{ height: '100%', width: '100%' }}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>

      {/* Aurora Borealis Effect (Deep Night Only) */}
      {isDeepNight && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: height * 0.5,
            opacity: auroraOpacity,
          }}
        >
          {auroraWaves.map(wave => (
            <Animated.View
              key={wave.id}
              style={{
                position: 'absolute',
                top: wave.baseY,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: wave.color,
                opacity: auroraAnimRef.current.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [wave.opacity * 0.3, wave.opacity, wave.opacity * 0.3],
                }),
                transform: [{
                  translateX: auroraAnimRef.current.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 20],
                  })
                }],
                borderRadius: 2,
              }}
            />
          ))}
        </Animated.View>
      )}

      {/* Enhanced Star Field */}
      {isNight && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: starOpacity,
          }}
        >
          {stars.map((star, index) => (
            <Animated.View
              key={star.id}
              style={{
                position: 'absolute',
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                backgroundColor: star.type === 'major' ? '#ffffff' : '#e6f3ff',
                borderRadius: star.size / 2,
                opacity: starTwinkleRefs.current[index] || star.brightness,
                shadowColor: star.type === 'major' ? '#ffffff' : '#e6f3ff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: star.type === 'major' ? 1 : 0.6,
                shadowRadius: star.type === 'major' ? 3 : 1,
                elevation: star.type === 'major' ? 5 : 2,
              }}
            />
          ))}
        </Animated.View>
      )}

      {/* Enhanced Sun with Realistic Effects */}
      {(isDay || isDawn || isSunset || isGoldenHour) && (
        <Animated.View
          style={{
            position: 'absolute',
            left: sunX - 20,
            top: sunY,
            width: 40,
            height: 40,
            opacity: sunGlow,
          }}
        >
          {/* Sun Corona */}
          <Animated.View style={{
            position: 'absolute',
            top: -15,
            left: -15,
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: isGoldenHour ? '#ffb347' : '#ffd700',
            opacity: 0.3,
          }} />
          
          {/* Main Sun Body */}
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: isGoldenHour ? '#ff8c00' : '#FFD700',
            borderRadius: 20,
            shadowColor: '#FFD700',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Sun surface details */}
            <View style={{
              position: 'absolute',
              top: 8,
              left: 12,
              width: 6,
              height: 6,
              backgroundColor: '#ffff99',
              borderRadius: 3,
              opacity: 0.8,
            }} />
            <View style={{
              position: 'absolute',
              top: 18,
              left: 25,
              width: 4,
              height: 4,
              backgroundColor: '#ffff99',
              borderRadius: 2,
              opacity: 0.6,
            }} />
          </View>

          {/* Enhanced Sun Rays */}
          <View style={{
            position: 'absolute',
            top: -35,
            left: -35,
            right: -35,
            bottom: -35,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((angle) => (
              <View
                key={angle}
                style={{
                  position: 'absolute',
                  width: angle % 40 === 0 ? 3 : 2,
                  height: angle % 40 === 0 ? 18 : 12,
                  backgroundColor: isGoldenHour ? '#ff8c00' : '#FFD700',
                  opacity: angle % 40 === 0 ? 0.8 : 0.5,
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: angle % 40 === 0 ? -40 : -35 }
                  ],
                  borderRadius: 1,
                }}
              />
            ))}
          </View>
        </Animated.View>
      )}

      {/* Enhanced Moon with Realistic Details */}
      {isNight && (
        <Animated.View
          style={{
            position: 'absolute',
            left: moonX - 18,
            top: moonY,
            width: 36,
            height: 36,
            opacity: moonGlow,
          }}
        >
          {/* Moon Halo */}
          <View style={{
            position: 'absolute',
            top: -12,
            left: -12,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#f5f5dc',
            opacity: 0.2,
          }} />
          
          {/* Main Moon Body */}
          <View style={{
            width: 36,
            height: 36,
            backgroundColor: '#F5F5DC',
            borderRadius: 18,
            shadowColor: '#F5F5DC',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 15,
            elevation: 8,
          }}>
            {/* Detailed Moon Craters */}
            <View style={{
              position: 'absolute',
              top: 6,
              left: 8,
              width: 5,
              height: 5,
              backgroundColor: '#d3d3d3',
              borderRadius: 2.5,
            }} />
            <View style={{
              position: 'absolute',
              top: 15,
              left: 20,
              width: 4,
              height: 4,
              backgroundColor: '#d3d3d3',
              borderRadius: 2,
            }} />
            <View style={{
              position: 'absolute',
              top: 22,
              left: 10,
              width: 3,
              height: 3,
              backgroundColor: '#d3d3d3',
              borderRadius: 1.5,
            }} />
            <View style={{
              position: 'absolute',
              top: 8,
              left: 25,
              width: 2,
              height: 2,
              backgroundColor: '#d3d3d3',
              borderRadius: 1,
            }} />
            <View style={{
              position: 'absolute',
              top: 25,
              left: 22,
              width: 2,
              height: 2,
              backgroundColor: '#d3d3d3',
              borderRadius: 1,
            }} />
          </View>
        </Animated.View>
      )}

      {/* Enhanced Multi-Layer Cloud System */}
      {/* High Altitude Clouds (Cirrus) */}
      <Animated.View style={{
        position: 'absolute',
        top: height * 0.1,
        left: cloudLayer1.interpolate({
          inputRange: [0, 1],
          outputRange: [-150, width + 50],
        }),
        opacity: 0.4,
      }}>
        <View style={{
          width: 120,
          height: 8,
          backgroundColor: 'white',
          borderRadius: 4,
        }}>
          <View style={{
            position: 'absolute',
            top: -3,
            left: 40,
            width: 60,
            height: 12,
            backgroundColor: 'white',
            borderRadius: 6,
          }} />
        </View>
      </Animated.View>

      {/* Medium Altitude Clouds (Cumulus) */}
      <Animated.View style={{
        position: 'absolute',
        top: height * 0.25,
        left: cloudLayer2.interpolate({
          inputRange: [0, 1],
          outputRange: [width + 80, -180],
        }),
        opacity: 0.6,
      }}>
        <View style={{
          width: 140,
          height: 35,
          backgroundColor: 'white',
          borderRadius: 17.5,
        }}>
          <View style={{
            position: 'absolute',
            top: -15,
            left: 35,
            width: 45,
            height: 45,
            backgroundColor: 'white',
            borderRadius: 22.5,
          }} />
          <View style={{
            position: 'absolute',
            top: -12,
            left: 60,
            width: 40,
            height: 40,
            backgroundColor: 'white',
            borderRadius: 20,
          }} />
          <View style={{
            position: 'absolute',
            top: -8,
            left: 85,
            width: 35,
            height: 35,
            backgroundColor: 'white',
            borderRadius: 17.5,
          }} />
        </View>
      </Animated.View>

      {/* Low Altitude Clouds (Stratus) */}
      <Animated.View style={{
        position: 'absolute',
        top: height * 0.4,
        left: cloudLayer3.interpolate({
          inputRange: [0, 1],
          outputRange: [-200, width + 100],
        }),
        opacity: 0.3,
      }}>
        <View style={{
          width: 160,
          height: 25,
          backgroundColor: 'white',
          borderRadius: 12.5,
        }}>
          <View style={{
            position: 'absolute',
            top: -10,
            left: 25,
            width: 35,
            height: 35,
            backgroundColor: 'white',
            borderRadius: 17.5,
          }} />
          <View style={{
            position: 'absolute',
            top: -8,
            left: 50,
            width: 30,
            height: 30,
            backgroundColor: 'white',
            borderRadius: 15,
          }} />
        </View>
      </Animated.View>
    </View>
  );
};

export default DayNightCycle;
