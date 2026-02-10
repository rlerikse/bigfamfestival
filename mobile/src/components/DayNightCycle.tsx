import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, Dimensions, Image, Text, TouchableOpacity } from 'react-native';
// Slider removed due to New Architecture incompatibility
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg'; // Removed unused Circle and Path

const { width } = Dimensions.get('window');

interface DayNightCycleProps {
  height: number;
  debugMode?: boolean;
  debugHour?: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  brightness: number;
  type: 'major' | 'minor';
}

const DayNightCycle: React.FC<DayNightCycleProps> = ({ height, debugMode = false, debugHour }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugHourValue, setDebugHourValue] = useState(new Date().getHours()); // State for debug slider
  const [starOpacity] = useState(new Animated.Value(0));
  const [sunGlow] = useState(new Animated.Value(0));
  const [moonGlow] = useState(new Animated.Value(0));
  const [horizonGlow] = useState(new Animated.Value(0));
  const [auroraOpacity] = useState(new Animated.Value(0));  // Multiple cloud layers for depth
  const [cloudLayer1] = useState(new Animated.Value(0));
  const [cloudLayer2] = useState(new Animated.Value(0.3));
  const [cloudLayer3] = useState(new Animated.Value(0.7));
  const [bigBackgroundCloud] = useState(new Animated.Value(0));
  const sunRayAnimation = useRef(new Animated.Value(0)).current; // Added for ray animation
  const starTwinkleRefs = useRef<Animated.Value[]>([]);
  const auroraAnimRef = useRef<Animated.Value>(new Animated.Value(0));
  const starsRef = useRef<Star[]>([]);
  // Initialize all animations
  useEffect(() => {
    // Initialize star twinkle animations (more realistic with varying intensity)
  starTwinkleRefs.current = Array.from({ length: 40 }, () => new Animated.Value(Math.random()));
    
    // Generate star positions once and store them
    if (starsRef.current.length === 0) {
      const stars = [];
      // Major stars (brighter, larger)
      for (let i = 0; i < 10; i++) {
        stars.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * (height * 0.6),
          size: Math.random() * 1.5 + 1,
          brightness: 0.8 + Math.random() * 0.2,
          type: 'major' as const
        });
      }
      // Minor stars (dimmer, smaller)
      for (let i = 10; i < 40; i++) {
        stars.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * (height * 0.7),
          size: Math.random() * 1 + 0.3,
          brightness: 0.3 + Math.random() * 0.4,
          type: 'minor' as const
        });
      }
      starsRef.current = stars;
    }
    
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
            useNativeDriver: true,
          }),
          Animated.timing(ref, {
            toValue: minOpacity,
            duration: 1500 + Math.random() * 3000,
            useNativeDriver: true,
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
          useNativeDriver: true,
        }),
        Animated.timing(auroraAnimRef.current, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sun Ray Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunRayAnimation, {
          toValue: 1,
          duration: 7000, // Slow animation (7 seconds)
          useNativeDriver: true,
        }),
        Animated.timing(sunRayAnimation, {
          toValue: 0,
          duration: 7000, // Slow animation (7 seconds)
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      twinkleAnimations.forEach(animation => animation.stop());
      // Need to stop other animations if they are started here and have refs
      // For example, if sunRayAnimation loop needs to be stopped:
      // sunRayAnimation.stopAnimation(); // Or however you manage its lifecycle
    }; // Corrected the closing brace for the return function
  }, [height, sunRayAnimation]); // Added sunRayAnimation

  // Enhanced cloud animations with different speeds and directions
  useEffect(() => {
    // Layer 1 - Slow moving high clouds (8 minutes)
    Animated.loop(
      Animated.timing(cloudLayer1, {
        toValue: 1,
        duration: 480000, // 8 minutes - slow but visible
        useNativeDriver: true,
      })
    ).start();

    // Layer 2 - Medium speed clouds (12 minutes)
    Animated.loop(
      Animated.timing(cloudLayer2, {
        toValue: 1,
        duration: 720000, // 12 minutes - medium slow
        useNativeDriver: true,
      })
    ).start();

    // Layer 3 - Slower moving low clouds (15 minutes)
    Animated.loop(
      Animated.timing(cloudLayer3, {
        toValue: 1,
        duration: 900000, // 15 minutes - slow
        useNativeDriver: true,
      })
    ).start();

    // Big Background Cloud - Very slow background movement (25 minutes)
    Animated.loop(
      Animated.timing(bigBackgroundCloud, {
        toValue: 1,
        duration: 1500000, // 25 minutes - very slow background movement
        useNativeDriver: true,
      })
    ).start();
  }, [cloudLayer1, cloudLayer2, cloudLayer3, bigBackgroundCloud, height]);
  // Update time every 1 second for smooth countdown and animation sync
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);
  const getTimeValues = React.useCallback(() => {
    let timeDecimal: number;
    
    if (debugMode && debugHour !== undefined) {
      // Use debug hour when in debug mode
      timeDecimal = debugHour;
    } else {
      // Use current time
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      timeDecimal = currentHours + currentMinutes / 60;
    }

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

    // Expanded night definition to include dusk for smoother moon transition
    const isNight = isDeepNight || isPreDawn || isDusk;
    const isDay = isMorning || isMidday || isAfternoon;return { 
      timeDecimal, 
      isDeepNight, isPreDawn, isDawn, isMorning, isMidday, 
      isAfternoon, isGoldenHour, isSunset, isDusk,
      isNight, isDay    };
  }, [currentTime, debugMode, debugHour]);

  // Enhanced sky gradient with realistic color temperature and atmospheric effects
  const getSkyGradient = (): [string, string, ...string[]] => {
    const { isDeepNight, isPreDawn, isDawn, isMorning, isMidday, isAfternoon, isGoldenHour, isSunset, isDusk } = getTimeValues();    if (isDeepNight) {
      return ['#0a0a1a', '#1a1a3a', '#2d2d4a']; // Deep space black to navy
    } else if (isPreDawn) {
      return ['#1a1a3a', '#2d2d4a', '#4a4a6a']; // Pre-dawn transition
    } else if (isDawn) {
      return ['#ffa07a', '#ffb366', '#ffd700', '#b0e0e6']; // Softer dawn colors - light salmon, peach, gold, powder blue
    } else if (isMorning) {
      return ['#b0e0e6', '#add8e6', '#e0f6ff']; // Gentle morning blues
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
    const { isNight, isDay, isGoldenHour, isSunset, isDawn, isDusk } = timeValues;

    Animated.parallel([
      // Stars fade in/out
      Animated.timing(starOpacity, {
        toValue: isNight ? 1 : 0,
        duration: 3000,
        useNativeDriver: true,
      }),
      // Sun glow effect
      Animated.timing(sunGlow, {
        toValue: (isDay || isGoldenHour || isSunset || isDawn) ? 1 : 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Moon glow effect
      Animated.timing(moonGlow, {
        toValue: isNight || isDusk ? 1 : 0,
        duration: 3000,
        useNativeDriver: true,
      }),
      // Horizon atmospheric glow
      Animated.timing(horizonGlow, {
        toValue: (isGoldenHour || isSunset || isDawn) ? 1 : 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Aurora effect (only during deep night)
      Animated.timing(auroraOpacity, {
        toValue: timeValues.isDeepNight ? 0.6 : 0,
        duration: 4000,
        useNativeDriver: true,
      }),
    ]).start();

  }, [currentTime, starOpacity, sunGlow, moonGlow, horizonGlow, auroraOpacity, getTimeValues, debugMode, debugHour]);

  const { sunX, sunY, moonX, moonY } = getCelestialPositions();
  const { timeDecimal, isNight, isDay, isDawn, isSunset, isGoldenHour, isDeepNight, isMidday, isMorning, isAfternoon, isDusk } = getTimeValues();

  // Helper function to determine sun colors based on time of day
  const getSunColors = () => {
    if (isMidday || isMorning || isAfternoon) return { body: '#FFD700', corona: '#FFFACD', rays: '#FFEB3B' }; // Bright yellow/gold
    if (isGoldenHour) return { body: '#FFA500', corona: '#FFDAB9', rays: '#FFC107' }; // Warm orange
    if (isSunset) return { body: '#FF4500', corona: '#FF8C00', rays: '#FF6347' }; // Deep orange-red
    if (isDawn) return { body: '#FFB366', corona: '#FFDAB9', rays: '#FFCCCB' }; // Softer peach/coral
    return { body: '#FFD700', corona: '#FFFACD', rays: '#FFEB3B' }; // Default
  };

  const sunColors = getSunColors(); // This will be used again for the rays

  // Calculate sun size and brightness based on time of day
  const getSunProperties = () => {
    // Define key time points
    const dawnStart = 5.5;
    const morningStart = 7;
    const middayStart = 10;
    const afternoonStart = 14;
    const goldenHourStart = 17;
    const sunsetStart = 18.5;
    const nightStart = 20; // Rays should be gone

    // Define base min/max values for properties
    const maxOverallScale = 3;    // Sun image scale
    const minOverallScale = 2;  // Increased from 1.5 to 2 (about 33% larger)
    const maxOverallBrightness = 1; // Sun image brightness
    const minOverallBrightness = 0.5;
    
    const maxRayD = 40;          // Ray properties
    const minRayD = 18;
    const maxRayL = 1.0;
    const minRayL = 0.4;
    const maxRayO = 0.4; // Max ray opacity
    const minRayO = 0.1; // Min ray opacity (rays almost invisible but can exist)

    // Helper function for interpolation
    const interpolate = (currentT: number, startT: number, endT: number, startV: number, endV: number): number => {
      if (currentT <= startT) return startV;
      if (currentT >= endT) return endV;
      const progress = (currentT - startT) / (endT - startT);
      return startV + progress * (endV - startV);
    };

    let scale = 0;
    let brightness = 0;
    let rayDensity = 0;
    let rayLengthFactor = 0;
    let rayOpacityFactor = 0;

    // Define property values at key transition points
    // Values at Dawn Start (5.5)
    const dawnStartScale = maxOverallScale, dawnStartBright = minOverallBrightness;
    const dawnStartDens = minRayD, dawnStartLen = minRayL, dawnStartOpac = minRayO;

    // Values at Morning Start (7) / Dawn End
    const morningStartScale = minOverallScale + (maxOverallScale - minOverallScale) * 0.75; // Getting smaller
    const morningStartBright = minOverallBrightness + (maxOverallBrightness - minOverallBrightness) * 0.25; // Getting brighter
    const morningStartDens = minRayD + (maxRayD - minRayD) * 0.25;
    const morningStartLen = minRayL + (maxRayL - minRayL) * 0.25;
    const morningStartOpac = minRayO + (maxRayO - minRayO) * 0.25;

    // Values at Midday Start (10) / Morning End
    const middayStartScale = minOverallScale;
    const middayStartBright = maxOverallBrightness;
    const middayStartDens = maxRayD;
    const middayStartLen = maxRayL;
    const middayStartOpac = maxRayO;

    // Values at Afternoon Start (14) / Midday End - same as Midday Start
    const afternoonStartScale = middayStartScale;
    const afternoonStartBright = middayStartBright;
    const afternoonStartDens = middayStartDens;
    const afternoonStartLen = middayStartLen;
    const afternoonStartOpac = middayStartOpac;

    // Values at Golden Hour Start (17) / Afternoon End
    const goldenHourStartScale = minOverallScale + (maxOverallScale - minOverallScale) * 0.25; // Getting larger
    const goldenHourStartBright = maxOverallBrightness - (maxOverallBrightness - minOverallBrightness) * 0.25; // Getting dimmer
    const goldenHourStartDens = maxRayD - (maxRayD - minRayD) * 0.25;
    const goldenHourStartLen = maxRayL - (maxRayL - minRayL) * 0.25;
    const goldenHourStartOpac = maxRayO - (maxRayO - minRayO) * 0.25;

    // Values at Sunset Start (18.5) / Golden Hour End
    const sunsetStartScale = maxOverallScale;
    const sunsetStartBright = minOverallBrightness;
    const sunsetStartDens = minRayD;
    const sunsetStartLen = minRayL;
    const sunsetStartOpac = minRayO;
    
    // Values at Night Start (20) / Sunset End (rays fade to zero)
    const nightStartScale = maxOverallScale * 0.9; // Sun slightly smaller as it sets
    const nightStartBright = minOverallBrightness * 0.7; // Sun dimmer
    const nightStartDens = 0;
    const nightStartLen = 0;
    const nightStartOpac = 0;

    if (timeDecimal < dawnStart || timeDecimal >= nightStart) { // Before dawn or after sunset starts fading rays
      scale = nightStartScale; // Keep sun somewhat visible if it's just set
      brightness = nightStartBright;
      rayDensity = 0;
      rayLengthFactor = 0;
      rayOpacityFactor = 0;
      if (timeDecimal >= nightStart + 1 || timeDecimal < dawnStart -1 ) { // Well into night or before pre-dawn
        brightness = 0; // Sun fully gone
        scale = 0;
      }
    } else if (timeDecimal >= dawnStart && timeDecimal < morningStart) { // Dawn
      scale = interpolate(timeDecimal, dawnStart, morningStart, dawnStartScale, morningStartScale);
      brightness = interpolate(timeDecimal, dawnStart, morningStart, dawnStartBright, morningStartBright);
      rayDensity = interpolate(timeDecimal, dawnStart, morningStart, dawnStartDens, morningStartDens);
      rayLengthFactor = interpolate(timeDecimal, dawnStart, morningStart, dawnStartLen, morningStartLen);
      rayOpacityFactor = interpolate(timeDecimal, dawnStart, morningStart, dawnStartOpac, morningStartOpac);
    } else if (timeDecimal >= morningStart && timeDecimal < middayStart) { // Morning
      scale = interpolate(timeDecimal, morningStart, middayStart, morningStartScale, middayStartScale);
      brightness = interpolate(timeDecimal, morningStart, middayStart, morningStartBright, middayStartBright);
      rayDensity = interpolate(timeDecimal, morningStart, middayStart, morningStartDens, middayStartDens);
      rayLengthFactor = interpolate(timeDecimal, morningStart, middayStart, morningStartLen, middayStartLen);
      rayOpacityFactor = interpolate(timeDecimal, morningStart, middayStart, morningStartOpac, middayStartOpac);
    } else if (timeDecimal >= middayStart && timeDecimal < afternoonStart) { // Midday
      scale = middayStartScale;
      brightness = middayStartBright;
      rayDensity = middayStartDens;
      rayLengthFactor = middayStartLen;
      rayOpacityFactor = middayStartOpac;
    } else if (timeDecimal >= afternoonStart && timeDecimal < goldenHourStart) { // Afternoon
      scale = interpolate(timeDecimal, afternoonStart, goldenHourStart, afternoonStartScale, goldenHourStartScale);
      brightness = interpolate(timeDecimal, afternoonStart, goldenHourStart, afternoonStartBright, goldenHourStartBright);
      rayDensity = interpolate(timeDecimal, afternoonStart, goldenHourStart, afternoonStartDens, goldenHourStartDens);
      rayLengthFactor = interpolate(timeDecimal, afternoonStart, goldenHourStart, afternoonStartLen, goldenHourStartLen);
      rayOpacityFactor = interpolate(timeDecimal, afternoonStart, goldenHourStart, afternoonStartOpac, goldenHourStartOpac);
    } else if (timeDecimal >= goldenHourStart && timeDecimal < sunsetStart) { // Golden Hour
      scale = interpolate(timeDecimal, goldenHourStart, sunsetStart, goldenHourStartScale, sunsetStartScale);
      brightness = interpolate(timeDecimal, goldenHourStart, sunsetStart, goldenHourStartBright, sunsetStartBright);
      rayDensity = interpolate(timeDecimal, goldenHourStart, sunsetStart, goldenHourStartDens, sunsetStartDens);
      rayLengthFactor = interpolate(timeDecimal, goldenHourStart, sunsetStart, goldenHourStartLen, sunsetStartLen);
      rayOpacityFactor = interpolate(timeDecimal, goldenHourStart, sunsetStart, goldenHourStartOpac, sunsetStartOpac);
    } else if (timeDecimal >= sunsetStart && timeDecimal < nightStart) { // Sunset
      scale = interpolate(timeDecimal, sunsetStart, nightStart, sunsetStartScale, nightStartScale);
      brightness = interpolate(timeDecimal, sunsetStart, nightStart, sunsetStartBright, nightStartBright);
      rayDensity = interpolate(timeDecimal, sunsetStart, nightStart, sunsetStartDens, nightStartDens);
      rayLengthFactor = interpolate(timeDecimal, sunsetStart, nightStart, sunsetStartLen, nightStartLen);
      rayOpacityFactor = interpolate(timeDecimal, sunsetStart, nightStart, sunsetStartOpac, nightStartOpac);
    }

    // Clamp values and ensure rayDensity is an integer
    scale = Math.max(0, Math.min(maxOverallScale, scale)); 
    brightness = Math.max(0, Math.min(maxOverallBrightness, brightness)); 
    rayDensity = Math.floor(Math.max(0, Math.min(maxRayD, rayDensity)));
    rayLengthFactor = Math.max(0, Math.min(maxRayL, rayLengthFactor));
    rayOpacityFactor = Math.max(0, Math.min(maxRayO, rayOpacityFactor));

    return { scale, brightness, rayDensity, rayLengthFactor, rayOpacityFactor };
  };

  const { scale: sunScale, brightness: sunBrightness, rayDensity, rayLengthFactor, rayOpacityFactor } = getSunProperties();

  // Helper function to generate sun rays
  const renderSunRays = () => { 
    const rays = [];
    const numRays = rayDensity;
    // Adjust sunRadius for ray starting point to be closer to the sun's body
    const sunImageRadius = 50 * sunScale; // Actual radius of the sun image
    const rayStartOffset = sunImageRadius * 0.5; // Rays start from 50% of the sun's radius
    const rayOuterRadius = rayStartOffset + (40 * rayLengthFactor * sunScale); // Shorter rays, adjusted base length from 60 to 40

    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * 2 * Math.PI;
      // Start rays closer to the center of the sun image
      const startX = rayStartOffset * Math.cos(angle);
      const startY = rayStartOffset * Math.sin(angle);
      const endX = rayOuterRadius * Math.cos(angle);
      const endY = rayOuterRadius * Math.sin(angle);
      
      let strokeWidth = 1.2; // Adjusted base stroke width
      if (isMidday) {
        strokeWidth = 2.0; // Adjusted midday stroke width
      } else if (isMorning || isAfternoon) {
        strokeWidth = 1.5; // Adjusted morning/afternoon stroke width
      }

      // Vary ray length slightly for a more natural look
      const lengthVariation = 1 + (Math.random() - 0.5) * 0.2; // +/- 10% variation

      rays.push(
        <Line
          key={`svg-ray-${i}`}
          x1={startX}
          y1={startY}
          x2={endX * lengthVariation}
          y2={endY * lengthVariation}
          stroke={sunColors.rays}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={rayOpacityFactor} // Apply dynamic opacity
        />
      );
    }
    return rays;
  };

  const auroraWaves = generateAuroraWaves();
  
  // Removed unused currentHourForCalculations variable

  // Ensure sunPosition is defined before calling renderSunRays
  const sunRaysVisuals = renderSunRays();

  return (
    <View style={{ 
      height, 
      width, 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      overflow: 'hidden', 
      pointerEvents: 'none',
      zIndex: -1 // Ensure this container is behind everything else if needed
    }}>
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
            zIndex: -1, // Above moon but below clouds
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
          {starsRef.current.map((star, index) => (
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
                opacity: starTwinkleRefs.current[index] ? starTwinkleRefs.current[index] : star.brightness,
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

      {/* Sun Image and SVG Rays Container */}
      {(isDay || isDawn || isSunset || isGoldenHour) && (
        <Animated.View
          style={{
            position: 'absolute',
            left: sunX - (50 * sunScale) - (60 * rayLengthFactor * sunScale),
            top: sunY - (50 * sunScale) - (60 * rayLengthFactor * sunScale),
            width: (100 * sunScale) + (120 * rayLengthFactor * sunScale),
            height: (100 * sunScale) + (120 * rayLengthFactor * sunScale),
            opacity: sunGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, sunBrightness]
            }),
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 0,
          }}
        >
          <Svg
            height="100%"
            width="100%"
            viewBox={`-${(50 * sunScale) + (60 * rayLengthFactor * sunScale)} -${(50 * sunScale) + (60 * rayLengthFactor * sunScale)} ${(100 * sunScale) + (120 * rayLengthFactor * sunScale)} ${(100 * sunScale) + (120 * rayLengthFactor * sunScale)}`}
          >
            {sunRaysVisuals}
          </Svg>
          <Animated.Image
            source={require('../assets/images/sun2.png')}
            style={{
              position: 'absolute',
              width: 100 * sunScale,
              height: 100 * sunScale,
              resizeMode: 'contain',
            }}
          />
        </Animated.View>
      )}

      {/* Enhanced Moon with Realistic Details */}
      {(isNight || isDusk) && (
        <Animated.View
          style={{
            position: 'absolute',
            left: moonX - 90,
            top: moonY - 90,
            width: 180,
            height: 180,
            opacity: moonGlow,
            zIndex: 0,
          }}
        >
          <Image
            source={require('../assets/images/moon.png')}
            style={{
              width: 180,
              height: 180,
              resizeMode: 'contain',
              opacity: 0.95,
            }}
          />
          
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f5f5dc',
            opacity: 0.12,
            borderRadius: 90,
          }} />
        </Animated.View>
      )}

      {/* Enhanced Multi-Layer Cloud System with Images */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        opacity: 0.8,
        width: '120%',
        height: '25%',
        zIndex: 2,
        transform: [
          {
            translateX: cloudLayer1.interpolate({
              inputRange: [0, 1],
              outputRange: [
                -1 * width * 1.0, // -100% of width
                width * 1.0 // 100% of width
              ],
            })
          }
        ]
      }}>
        <Image
          source={require('../assets/images/cloud-1.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        top: 0,
        opacity: 0.7,
        width: '110%',
        height: '22%',
        zIndex: 2,
        transform: [
          {
            translateX: cloudLayer2.interpolate({
              inputRange: [0, 1],
              outputRange: [
                width * 1.0, // 100% of width
                -1 * width * 1.0 // -100% of width
              ],
            })
          }
        ]
      }}>
        <Image
          source={require('../assets/images/cloud-2.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        top: 0,
        opacity: 0.6,
        width: '100%',
        height: '18%',
        zIndex: 2,
        transform: [
          {
            translateX: cloudLayer3.interpolate({
              inputRange: [0, 1],
              outputRange: [
                -1 * width * 1.2, // -120% of width
                width * 1.2 // 120% of width
              ],
            })
          }
        ]
      }}>
        <Image
          source={require('../assets/images/cloud-3.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        top: 0,
        opacity: 0.6,
        width: '180%',
        height: '35%',
        zIndex: 1,
        transform: [
          {
            translateX: bigBackgroundCloud.interpolate({
              inputRange: [0, 1],
              outputRange: [
                -1 * width * 0.5, // -50% of width
                width * 1.5 // 150% of width
              ],
            })
          }
        ]
      }}>
        <Image
          source={require('../assets/images/cloud-4.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Debug Controls */}
      {debugMode && (
        <View style={{
          position: 'absolute',
          bottom: 390,
          width: width * 0.8,
          alignSelf: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 10,
          borderRadius: 5,
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <Text style={{ color: 'white', textAlign: 'center', marginBottom: 5 }}>
            {`Time: ${Math.floor(debugHourValue).toString().padStart(2, '0')}:${Math.round((debugHourValue - Math.floor(debugHourValue)) * 60).toString().padStart(2, '0')}`}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ backgroundColor: '#FFD700', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 }}
              onPress={() => setDebugHourValue((prev) => (prev - 1 + 24) % 24)}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>-</Text>
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 18, minWidth: 50, textAlign: 'center' }}>
              {Math.floor(debugHourValue)}h
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#FFD700', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 }}
              onPress={() => setDebugHourValue((prev) => (prev + 1) % 24)}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Helper function to generate aurora waves
function generateAuroraWaves() {
  const waves = [];
  const colors = [
    'rgba(97, 255, 189, 0.6)',  // Bright green
    'rgba(0, 255, 127, 0.5)',   // Green
    'rgba(173, 255, 47, 0.4)',  // Green-yellow
    'rgba(0, 191, 255, 0.5)',   // Deep sky blue
    'rgba(138, 43, 226, 0.4)',  // Blue-violet
    'rgba(30, 144, 255, 0.3)',  // Dodger blue
  ];
  
  for (let i = 0; i < 20; i++) {
    const baseY = (i * 4) + Math.random() * 30;
    waves.push({
      id: i,
      baseY,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.2 + Math.random() * 0.6
    });
  }
  
  return waves;
}

export default DayNightCycle;

