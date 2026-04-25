import Groq from 'groq-sdk';
import { WeatherData } from './weatherService';

let groq: Groq | null = null;

const getGroq = () => {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groq = new Groq({ apiKey });
  }
  return groq;
};

const stripMarkdown = (text: string): string => {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
};

export type AssetType = 'building' | 'bridge' | 'tower';

interface WorkerSafetyData {
  level: 'Safe' | 'Caution' | 'Restricted' | 'Hazardous';
  advisory: string;
}

interface PredictionData {
  riskLevel: string;
  threats: { name: string; description: string }[];
  recommendations: string[];
  assetType: AssetType;
  weatherSnapshot: {
    condition: string;
    temperatureC: number | null;
    humidityPercent: number | null;
    windSpeedKmh: number | null;
    aqiIndex: number | null;
    aqiLabel: string;
  };
  workerSafety: WorkerSafetyData;
}

interface PredictionContext {
  assetType: AssetType;
  weather: WeatherData;
}

export const getDisasterPrediction = async (
  lat: number,
  lng: number,
  context: PredictionContext
): Promise<PredictionData> => {
  const prompt = `You are an infrastructure integrity and predictive maintenance AI assistant.
Analyze the location and environmental telemetry for a ${context.assetType}.

Location: Latitude ${lat}, Longitude ${lng}
Date: ${new Date().toLocaleDateString()}
Weather Condition: ${context.weather.condition}
Temperature: ${context.weather.temperatureC ?? 'Unknown'} C
Humidity: ${context.weather.humidityPercent ?? 'Unknown'}%
Wind Speed: ${context.weather.windSpeedKmh ?? 'Unknown'} km/h
AQI Index: ${context.weather.aqiIndex ?? 'Unknown'} (${context.weather.aqiLabel})
Current Worker Safety Baseline: ${context.weather.workerSafetyLevel} - ${context.weather.workerSafetyAdvisory}

Respond ONLY with valid JSON in this exact format:
{
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "threats": [
    { "name": "ThreatName", "description": "Brief description of the structural or mechanical threat" }
  ],
  "recommendations": [
    "Technical Recommendation 1",
    "Technical Recommendation 2",
    "Technical Recommendation 3"
  ],
  "workerSafety": {
    "level": "Safe" | "Caution" | "Restricted" | "Hazardous",
    "advisory": "Practical worker safety action for current AQI and weather exposure"
  }
}

Include 2-4 threats relevant to this asset class and 3-5 technical maintenance recommendations.`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const normalizedSafety = normalizeWorkerSafety(parsed.workerSafety, context.weather);
        return {
          riskLevel: normalizeRiskLevel(parsed.riskLevel),
          threats: normalizeThreats(parsed.threats, context.assetType),
          recommendations: normalizeRecommendations(parsed.recommendations, context.assetType),
          assetType: context.assetType,
          weatherSnapshot: {
            condition: context.weather.condition,
            temperatureC: context.weather.temperatureC,
            humidityPercent: context.weather.humidityPercent,
            windSpeedKmh: context.weather.windSpeedKmh,
            aqiIndex: context.weather.aqiIndex,
            aqiLabel: context.weather.aqiLabel,
          },
          workerSafety: normalizedSafety,
        };
      }
    }
    return getFallbackPrediction(lat, lng, context);
  } catch (error) {
    console.error('Groq API error:', error);
    return getFallbackPrediction(lat, lng, context);
  }
};

const normalizeRiskLevel = (riskLevel: unknown): 'Low' | 'Medium' | 'High' | 'Critical' => {
  const level = String(riskLevel || '').toLowerCase();
  if (level === 'low') return 'Low';
  if (level === 'high') return 'High';
  if (level === 'critical') return 'Critical';
  return 'Medium';
};

const normalizeThreats = (
  threats: unknown,
  assetType: AssetType
): { name: string; description: string }[] => {
  if (Array.isArray(threats)) {
    const validThreats = threats
      .filter((item): item is { name: unknown; description: unknown } => Boolean(item))
      .map((item) => ({
        name: String(item.name || '').trim(),
        description: String(item.description || '').trim(),
      }))
      .filter((item) => item.name && item.description);

    if (validThreats.length > 0) {
      return validThreats;
    }
  }

  const defaults: Record<AssetType, { name: string; description: string }[]> = {
    building: [
      { name: 'Facade Degradation', description: 'Weather cycling can loosen cladding and facade anchors on upper floors.' },
      { name: 'HVAC Load Stress', description: 'High heat and poor air quality elevate cooling load and indoor air recirculation risk.' },
    ],
    bridge: [
      { name: 'Bearing Fatigue', description: 'Temperature and vibration shifts increase fatigue risk at bearings and expansion joints.' },
      { name: 'Deck Corrosion', description: 'Moisture and polluted air accelerate rebar and connector corrosion in bridge decks.' },
    ],
    tower: [
      { name: 'Wind-Induced Oscillation', description: 'Strong gusts can increase oscillation amplitude and stress anchor assemblies.' },
      { name: 'Joint Corrosion', description: 'Humidity and airborne pollutants accelerate corrosion at bolted and welded joints.' },
    ],
  };

  return defaults[assetType];
};

const normalizeRecommendations = (recommendations: unknown, assetType: AssetType): string[] => {
  if (Array.isArray(recommendations)) {
    const validRecommendations = recommendations
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    if (validRecommendations.length > 0) {
      return validRecommendations;
    }
  }

  const defaults: Record<AssetType, string[]> = {
    building: [
      'Inspect rooftop drainage and facade anchors for weather-induced looseness.',
      'Increase indoor filtration and recirculation control when AQI exceeds moderate thresholds.',
      'Run thermal scans on electrical rooms and high-load vertical transport equipment.',
    ],
    bridge: [
      'Inspect expansion joints and bearings for thermal shift and mechanical wear.',
      'Perform spot corrosion checks on deck reinforcement and cable terminations.',
      'Increase vibration and strain telemetry sampling during high wind periods.',
    ],
    tower: [
      'Verify bolt torque and weld integrity at primary joint clusters.',
      'Enable tighter oscillation alerts for high-wind windows and gust fronts.',
      'Inspect lightning, grounding, and external maintenance fixtures after storms.',
    ],
  };

  return defaults[assetType];
};

const normalizeWorkerSafety = (workerSafety: unknown, weather: WeatherData): WorkerSafetyData => {
  if (workerSafety && typeof workerSafety === 'object') {
    const data = workerSafety as { level?: unknown; advisory?: unknown };
    const normalizedLevel = String(data.level || '').toLowerCase();
    const allowedLevels: WorkerSafetyData['level'][] = ['Safe', 'Caution', 'Restricted', 'Hazardous'];
    const mappedLevel = (
      normalizedLevel === 'safe'
        ? 'Safe'
        : normalizedLevel === 'restricted'
          ? 'Restricted'
          : normalizedLevel === 'hazardous'
            ? 'Hazardous'
            : normalizedLevel === 'caution'
              ? 'Caution'
              : weather.workerSafetyLevel
    ) as WorkerSafetyData['level'];

    const advisory = String(data.advisory || '').trim() || weather.workerSafetyAdvisory;
    if (allowedLevels.includes(mappedLevel)) {
      return { level: mappedLevel, advisory };
    }
  }

  return {
    level: weather.workerSafetyLevel,
    advisory: weather.workerSafetyAdvisory,
  };
};

const getFallbackPrediction = (lat: number, lng: number, context: PredictionContext): PredictionData => {
  const month = new Date().getMonth();
  const isSummer = month >= 5 && month <= 8;
  const isWinter = month >= 11 || month <= 2;
  const baseRiskScore = computeRiskScore(context.weather, context.assetType);

  const threats: { name: string; description: string }[] = [
    { name: 'Structural Fatigue', description: 'Monitoring stress points for micro-fractures in primary load-bearing elements' },
    { name: 'Hydraulic Pressure', description: 'Assessing pressure differentials against containment specifications' },
    { name: 'Thermal Gradient', description: 'Monitoring abnormal heat expansion patterns across structural joints' },
  ];

  if (isSummer) {
    threats.push({ name: 'Corrosion Accelerant', description: 'Increased humidity and temperature potentially accelerating oxidation on metallic supports' });
  }

  if (isWinter) {
    threats.push({ name: 'Ice Jacking', description: 'Refreezing of moisture inside cracks causing potential expansion-led structural damage' });
  }

  if (lat > 35 || lat < -35) {
    threats.push({ name: 'Coastal Erosion', description: 'Salinity and foundation undercutting risks due to proximity to shoreline' });
  }

  if (context.assetType === 'tower') {
    threats.push({ name: 'Wind Oscillation', description: 'High-rise/tower structures may encounter elevated dynamic sway under gust fronts.' });
  }
  if (context.assetType === 'bridge') {
    threats.push({ name: 'Joint Fatigue', description: 'Cyclic loading and thermal movement increase fatigue on bearings and expansion joints.' });
  }

  return {
    riskLevel: riskScoreToLevel(baseRiskScore),
    threats,
    recommendations: [
      'Initiate sonar structural scan to inspect underwater foundations',
      'Schedule ultrasonic testing on weld joints and connector points',
      'Deploy localized sensor arrays to monitor real-time vibration amplitude',
      'Review structural blueprints for load-capacity deviations',
    ],
    assetType: context.assetType,
    weatherSnapshot: {
      condition: context.weather.condition,
      temperatureC: context.weather.temperatureC,
      humidityPercent: context.weather.humidityPercent,
      windSpeedKmh: context.weather.windSpeedKmh,
      aqiIndex: context.weather.aqiIndex,
      aqiLabel: context.weather.aqiLabel,
    },
    workerSafety: {
      level: context.weather.workerSafetyLevel,
      advisory: context.weather.workerSafetyAdvisory,
    },
  };
};

const computeRiskScore = (weather: WeatherData, assetType: AssetType): number => {
  const aqiContribution = weather.aqiIndex ? weather.aqiIndex * 12 : 25;
  const temperatureContribution = weather.temperatureC ? Math.max(0, weather.temperatureC - 25) * 1.2 : 8;
  const windContribution = weather.windSpeedKmh ? Math.max(0, weather.windSpeedKmh - 20) * 0.9 : 7;
  const humidityContribution = weather.humidityPercent ? Math.max(0, weather.humidityPercent - 60) * 0.5 : 5;
  const assetMultiplier = assetType === 'tower' ? 1.2 : assetType === 'bridge' ? 1.1 : 1.0;
  return Math.min(100, (aqiContribution + temperatureContribution + windContribution + humidityContribution) * assetMultiplier);
};

const riskScoreToLevel = (score: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  if (score >= 75) return 'Critical';
  if (score >= 55) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
};

export const getDisasterGuide = async (disaster: string): Promise<string> => {
  const prompt = `Provide a comprehensive Standard Operating Procedure (SOP) for "${disaster}" infrastructure maintenance and failure prevention.

Structure the response clearly with:
1. 🚨 **Immediate Protocols** (Urgent actions - bullet points)
2. ✅ **Maintenance Do's** and ❌ **Maintenance Don'ts** (clear lists)
3. 🛠️ **Engineering Checklist** (Sensors and items to verify)
4. 🏗️ **Operational Resources** (Dispatch contacts and manuals)

Use relevant emojis for every bullet point. Make it visually easy to scan for engineering teams on site.`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content || getFallbackGuide(disaster);
    return stripMarkdown(content);
  } catch (error) {
    console.error('Groq guide error:', error);
    return getFallbackGuide(disaster);
  }
};

const getFallbackGuide = (disaster: string): string => {
  const guides: Record<string, string> = {
    earthquake: `
## 🏗️ Bridges & Tunnels: Maintenance Protocol

### 🚨 Immediate Protocols
- ⚖️ Initiate load-monitoring sensors immediately
- 📏 Inspect expansion joints for abnormal alignment
- 🛡️ Deploy automated lane-closure if vibration exceeds 0.5g
- ⚠️ Check pier foundations for scour or shift

### ✅ Maintenance Do's
- ✅ Recalibrate strain gauges every 30 days
- ✅ Schedule ultrasonic weld inspections quarterly
- ✅ Apply anti-corrosion coatings to steel cables annually
- ✅ Monitor traffic-induced frequency resonance

### ❌ Maintenance Don'ts
- ❌ Do not exceed technical load-bearing specifications
- ❌ Do not ignore micro-fractures in concrete support pillars
- ❌ Do not delay repairs on damping systems after high-wind events
- ❌ Do not bypass automated safety shutoffs during testing

### 🛠️ Engineering Checklist
- [ ] Primary cable tension sensors
- [ ] Deck vibration telemetry
- [ ] Joint expansion digital calipers
- [ ] Secondary electrical backup units
- [ ] Structural integrity blueprints (Rev. 4)
`,
    flood: `
## 🌊 Dams & Reservoirs: Maintenance Protocol

### 🚨 Immediate Protocols
- 🚨 Open emergency spillway valves to nominal flow
- 🏠 Initiate seepage monitoring arrays in lower embankments
- 🌊 Check piezometric levels for pressure differentials
- 📻 Alert downstream regional command centers

### ✅ Maintenance Do's
- ✅ Perform weekly inspection of spillway gate mechanisms
- ✅ Clear debris from intake structures and trash racks
- ✅ Inspect dam toe for increased vegetation or wet spots (seepage)
- ✅ Verify backup diesel power for gate actuators

### ❌ Maintenance Don'ts
- ❌ Do not allow reservoir level to exceed critical peak
- ❌ Do not ignore turbidity changes in seepage runoff
- ❌ Do not use non-certified concrete for spillway pitting repairs
- ❌ Do not delay communication with local safety officials

### 🛠️ Engineering Checklist
- [ ] Piezometer sensors (A-D)
- [ ] Spillway hydraulic actuators
- [ ] Sluice gate backup batteries
- [ ] Real-time water volume telemetry
`,
    fire: `
## ⚡ Power Stations: Maintenance Protocol

### 🚨 Immediate Protocols
- 🔔 Deploy automated thermal suppression systems
- 🧊 Activate coolant circulation at 110% capacity
- 🚪 Seal high-voltage containment zones
- 🏃 Evacuate non-essential personnel to safe zones

### ✅ Maintenance Do's
- ✅ Conduct monthly thermal imaging of all transformers
- ✅ Test insulation resistance on core components
- ✅ Update fire suppression charge levels bi-annually
- ✅ Verify grid-sync integrity on backup relays

### ❌ Maintenance Don'ts
- ❌ Do not allow transformer oil temperature to exceed 95°C
- ❌ Do not bypass interlock safety systems
- ❌ Do not use unauthorized personnel for high-voltage testing
- ❌ Do not ignore cooling tower pump cavitation

### 🛠️ Engineering Checklist
- [ ] Thermal imaging cameras
- [ ] Insulated testing tools
- [ ] Backup generator fuel stocks
- [ ] Fire suppression chemical inventory
`,
    hurricane: `
## 🏢 High-Rise Buildings: Maintenance Protocol

### 🚨 Immediate Protocols
- 📻 Activate wind-loading telemetry arrays
- 🏠 Initiate emergency glass-integrity bracing
- 🧊 Prime secondary damping systems
- 🚗 Secure all external maintenance platforms

### ✅ Maintenance Do's
- ✅ Inspect damper fluid levels every 6 months
- ✅ Check structural sealant on high-altitude casing
- ✅ Maintain emergency roof access for structural engineers
- ✅ Perform vibration analysis on primary elevators

### ❌ Maintenance Don'ts
- ❌ Do not allow occupancy during peak structural displacement
- ❌ Do not ignore hairline cracks in glazing panels
- ❌ Do not use elevators during high-wind instability alerts
- ❌ Do not delay maintenance on counter-weight systems

### 🛠️ Engineering Checklist
- [ ] Anemometer arrays (Roof)
- [ ] Structural strain gauges
- [ ] Elevator counter-weight sensors
- [ ] Building management system (BMS) logs
`,
    tornado: `
## 📡 Sensor Nodes: Maintenance Protocol

### 🚨 Immediate Protocols
- 🚨 Initiate self-diagnostics across entire array
- 🏠 Switch to low-latency satellite backup if fiber fails
- 🌊 Activate emergency power protocols for high-priority grids
- 📻 Report ping-loss anomalies to central hub

### ✅ Maintenance Do's
- ✅ Update firmware on a strictly controlled roll-out schedule
- ✅ Check physical housing integrity for moisture ingress
- ✅ Test battery backup capacity under peak load
- ✅ Verify encryption keys for sensor data transmission

### ❌ Maintenance Don'ts
- ❌ Do not deploy untested updates during storm seasons
- ❌ Do not bypass encrypted communication channels
- ❌ Do not ignore battery cell degradation over 20%
- ❌ Do not allow physical access without Level 2 clearance

### 🛠️ Engineering Checklist
- [ ] Spectrum analysis tools
- [ ] Spare battery units (20Ah)
- [ ] Weatherproof cabling (IP68)
- [ ] Network diagnostic software
`,
    tsunami: `
## 🛣️ Road Networks: Maintenance Protocol

### 🚨 Immediate Protocols
- 🚨 Deploy digital signage for automated diversions
- 🏠 Inspect drainage capacity in low-lying zones
- 🏢 Scan primary asphalt for sudden sinkhole formation
- 📻 Coordinate logistics with field repair crews

### ✅ Maintenance Do's
- ✅ Clear drainage culverts before heavy rainfall season
- ✅ Perform subsurface scans for void detection
- ✅ Maintain clear emergency shoulders for maintenance fleets
- ✅ Resurface high-wear zones before depth loss reaches 5%

### ❌ Maintenance Don'ts
- ❌ Do not allow heavy machinery on compromised surfaces
- ❌ Do not ignore surface cracks over 12mm width
- ❌ Do not use sub-standard asphalt for repair patches
- ❌ Do not delay debris clearance from primary transit routes

### 🛠️ Engineering Checklist
- [ ] Ground penetrating radar (GPR)
- [ ] Laser surface profilers
- [ ] Traffic management digital controllers
- [ ] Drainage flow rate sensors
`,
  };

  return guides[disaster.toLowerCase()] || `
## ⚠️ ${disaster.charAt(0).toUpperCase() + disaster.slice(1)} Infrastructure Protocol

### 🚨 Immediate Protocols
- Initiate structural assessment protocol
- Follow Level 1 safety procedures
- Secure primary asset sections
- Coordinate with field engineering teams

### ✅ Maintenance Do's
- ✅ Perform regular integrity scans
- ✅ Log all sensor telemetry deviations
- ✅ Update maintenance schedules based on real-time data
- ✅ Maintain clear communication with regional command

### ❌ Maintenance Don'ts
- ❌ Do not ignore structural anomalies
- ❌ Do not delay critical maintenance due to budget
- ❌ Do not use uncertified repair components
- ❌ Do not bypass primary safety protocols

### 🛠️ Engineering Checklist
- [ ] Active IoT sensor arrays
- [ ] Structural blueprints
- [ ] Maintenance logs
- [ ] Field communication equipment
`;
};
