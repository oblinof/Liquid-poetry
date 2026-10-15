import { MarineData } from '../types/generative';

// Florianópolis oceanic coordinates (Praia da Joaquina / Praia Mole, Ilha de Santa Catarina)
export const FLORIPA_COORDS = {
  lat: -27.598,
  lon: -48.432,
  spotName: 'Praia da Joaquina & Mole, Florianópolis (SC)'
};

const DEFAULT_MARINE_STATE: MarineData = {
  waveHeight: 1.75, // meters
  wavePeriod: 11.4, // seconds
  waveDirection: 140, // SE swell
  windWaveHeight: 0.6,
  swellWaveHeight: 1.55,
  windSpeed: 16.5, // km/h
  windDirection: 110,
  waterTemp: 21.8, // °C
  tidePhase: 'pleamar',
  tideLevel: 0.68,
  location: FLORIPA_COORDS.spotName,
  isLive: false,
  lastUpdated: new Date().toLocaleTimeString('es-AR')
};

// Calculates semi-diurnal tide approximation (approx 12.4h cycle)
function calculateTidePhase(now: Date): { phase: MarineData['tidePhase']; level: number } {
  const hours = now.getHours() + now.getMinutes() / 60;
  // Lunar tide phase angle: cycle roughly every 12.42 hours
  const tideAngle = (hours % 12.42) / 12.42 * 2 * Math.PI;
  const level = Math.sin(tideAngle); // -1.0 to 1.0

  let phase: MarineData['tidePhase'] = 'flujo';
  if (level > 0.75) phase = 'pleamar';
  else if (level < -0.75) phase = 'bajamar';
  else if (Math.cos(tideAngle) > 0) phase = 'flujo'; // rising
  else phase = 'reflujo'; // falling

  return { phase, level: Number(level.toFixed(2)) };
}

export async function fetchFloripaMarineData(): Promise<MarineData> {
  const now = new Date();
  const tide = calculateTidePhase(now);

  try {
    // Open-Meteo Marine API is free, public, CORS-enabled, no key needed
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${FLORIPA_COORDS.lat}&longitude=${FLORIPA_COORDS.lon}&current=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_period`;
    
    // Open-Meteo Weather for wind and temperature
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${FLORIPA_COORDS.lat}&longitude=${FLORIPA_COORDS.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [marineRes, weatherRes] = await Promise.allSettled([
      fetch(marineUrl, { signal: controller.signal }),
      fetch(weatherUrl, { signal: controller.signal })
    ]);

    clearTimeout(timeoutId);

    let waveHeight = DEFAULT_MARINE_STATE.waveHeight;
    let wavePeriod = DEFAULT_MARINE_STATE.wavePeriod;
    let waveDirection = DEFAULT_MARINE_STATE.waveDirection;
    let windWaveHeight = DEFAULT_MARINE_STATE.windWaveHeight;
    let swellWaveHeight = DEFAULT_MARINE_STATE.swellWaveHeight;
    let windSpeed = DEFAULT_MARINE_STATE.windSpeed;
    let windDirection = DEFAULT_MARINE_STATE.windDirection;
    let waterTemp = DEFAULT_MARINE_STATE.waterTemp;
    let isLive = false;

    if (marineRes.status === 'fulfilled' && marineRes.value.ok) {
      const marineJson = await marineRes.value.json();
      if (marineJson?.current) {
        waveHeight = marineJson.current.wave_height ?? waveHeight;
        wavePeriod = marineJson.current.wave_period ?? wavePeriod;
        waveDirection = marineJson.current.wave_direction ?? waveDirection;
        windWaveHeight = marineJson.current.wind_wave_height ?? windWaveHeight;
        swellWaveHeight = marineJson.current.swell_wave_height ?? swellWaveHeight;
        isLive = true;
      }
    }

    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      const weatherJson = await weatherRes.value.json();
      if (weatherJson?.current) {
        windSpeed = weatherJson.current.wind_speed_10m ?? windSpeed;
        windDirection = weatherJson.current.wind_direction_10m ?? windDirection;
        waterTemp = weatherJson.current.temperature_2m ? weatherJson.current.temperature_2m - 1.5 : waterTemp;
      }
    }

    return {
      waveHeight: Number(waveHeight.toFixed(2)),
      wavePeriod: Number(wavePeriod.toFixed(1)),
      waveDirection: Math.round(waveDirection),
      windWaveHeight: Number(windWaveHeight.toFixed(2)),
      swellWaveHeight: Number(swellWaveHeight.toFixed(2)),
      windSpeed: Number(windSpeed.toFixed(1)),
      windDirection: Math.round(windDirection),
      waterTemp: Number(waterTemp.toFixed(1)),
      tidePhase: tide.phase,
      tideLevel: tide.level,
      location: FLORIPA_COORDS.spotName,
      isLive,
      lastUpdated: now.toLocaleTimeString('es-AR')
    };
  } catch (err) {
    console.warn('Using fallback Floripa marine data:', err);
    return {
      ...DEFAULT_MARINE_STATE,
      tidePhase: tide.phase,
      tideLevel: tide.level,
      lastUpdated: now.toLocaleTimeString('es-AR')
    };
  }
}
