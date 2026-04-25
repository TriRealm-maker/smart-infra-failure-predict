import axios from 'axios';

interface PredictionResult {
  riskLevel: string;
  threats: string[];
  recommendation: string;
}

export const getDisasterPrediction = async (
  lat: number,
  lng: number,
  weather?: { temperature: string; condition: string }
): Promise<string> => {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const prompt = `You are a disaster prediction AI assistant. Analyze the following location and weather data to assess natural disaster risks.

Location: Latitude ${lat}, Longitude ${lng}
Date: ${new Date().toLocaleDateString()}
Weather: ${weather?.temperature || 'Unknown'}, ${weather?.condition || 'Unknown conditions'}

Provide a concise risk assessment with:
1. Risk Level (Low/Medium/High/Critical)
2. Top 3 potential threats for this area (e.g., earthquake, flood, wildfire, hurricane, tornado, tsunami, landslides)
3. Brief preparation recommendation

Format your response as markdown with clear sections. Keep it brief and actionable.`;

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
        },
      },
      { timeout: 30000 }
    );

    return response.data.response || 'Unable to generate prediction at this time.';
  } catch (error) {
    console.error('Ollama API error:', error);
    return getFallbackPrediction(lat, lng);
  }
};

const getFallbackPrediction = (lat: number, lng: number): string => {
  // Basic rule-based fallback
  const month = new Date().getMonth();
  const isSummer = month >= 5 && month <= 8;
  const isWinter = month >= 11 || month <= 2;

  let risks = '## Risk Assessment\n\n';
  risks += '**Overall Risk Level:** Medium\n\n';
  risks += '### Potential Threats\n';
  risks += '- 🌧️ **Flooding** - Check local drainage systems\n';
  risks += '- 🔥 **Wildfire** - Dry conditions can spark fires\n';
  risks += '- 🌡️ **Extreme Heat** - Stay hydrated during summer\n';

  if (isSummer) {
    risks += '- 🌀 **Hurricane** - Hurricane season (June-November)\n';
  }

  if (isWinter) {
    risks += '- ❄️ **Winter Storm** - Prepare for cold weather emergencies\n';
  }

  // Specific region checks (simplified)
  if (lat > 35 || lat < -35) {
    risks += '- 🌊 **Tsunami** - Coastal area, know evacuation routes\n';
  }

  risks += '\n### Recommendations\n';
  risks += '- Keep emergency kit ready\n';
  risks += '- Monitor local weather alerts\n';
  risks += '- Know your evacuation routes\n';
  risks += '- Keep important documents secure\n';

  risks += '\n\n---\n*Note: This is a basic assessment. For accurate predictions, ensure Ollama server is running.*';

  return risks;
};

export const getDisasterGuide = async (disaster: string): Promise<string> => {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';

  const prompt = `Provide a comprehensive emergency guide for a "${disaster}" disaster.

Structure the response clearly with:
1. 🚨 **Immediate Actions** (What to do NOW - bullet points)
2. ✅ **Do's** and ❌ **Don'ts** (clear lists)
3. 🎒 **Preparation Checklist** (items to have ready)
4. 🏥 **Emergency Resources** (important contacts)

Use relevant emojis for every bullet point. Make it visually easy to scan during an emergency.`;

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.5,
        },
      },
      { timeout: 30000 }
    );

    return response.data.response || getFallbackGuide(disaster);
  } catch (error) {
    console.error('Ollama guide error:', error);
    return getFallbackGuide(disaster);
  }
};

const getFallbackGuide = (disaster: string): string => {
  const guides: Record<string, string> = {
    earthquake: `
## 🌍 Earthquake Emergency Guide

### 🚨 Immediate Actions
- 🔥 Drop to your hands and knees
- 🛡️ Cover your head and neck under sturdy furniture
- 🏃 Hold on until the shaking stops
- ⚠️ Stay away from windows and heavy objects

### ✅ Do's
- ✅ Stay indoors until shaking stops
- ✅ Check for injuries
- ✅ Expect aftershocks
- ✅ Use flashlight, not candles

### ❌ Don'ts
- ❌ Don't run outside during shaking
- ❌ Don't use elevators
- ❌ Don't touch downed power lines
- ❌ Don't spread rumors

### 🎒 Preparation Checklist
- [ ] Emergency kit with water and food
- [ ] Flashlight and batteries
- [ ] First aid supplies
- [ ] Battery-powered radio
- [ ] Important documents
`,
    flood: `
## 🌊 Flood Emergency Guide

### 🚨 Immediate Actions
- 🚨 Move to higher ground immediately
- 🏠 Get to roof if trapped by rising water
- 🚗 Never walk or drive through flood waters
- 📻 Listen to emergency broadcasts

### ✅ Do's
- ✅ Follow evacuation orders
- ✅ Turn off utilities if safe
- ✅ Sanitize contaminated items
- ✅ Document damage for insurance

### ❌ Don'ts
- ❌ Don't walk in standing water
- ❌ Don't drive through flooded roads
- ❌ Don't drink flood water
- ❌ Don't return until safe

### 🎒 Preparation Checklist
- [ ] Sandbags if available
- [ ] Water purification tablets
- [ ] Emergency food and water (3 days)
- [ ] waterproof containers for documents
`,
    fire: `
## 🔥 Fire Emergency Guide

### 🚨 Immediate Actions
- 🔔 Alert others and evacuate
- 🧊 Close doors behind you to slow spread
- 🚪 Feel doors before opening
- 🏃 Stay low to avoid smoke

### ✅ Do's
- ✅ Crawl low under smoke
- ✅ Stop, drop, and roll if clothes catch fire
- ✅ Use fire extinguisher if trained
- ✅ Call 911 from safe location

### ❌ Don'ts
- ❌ Don't use elevators
- ❌ Don't hide in closets
- ❌ Don't go back inside
- ❌ Don't use water on electrical fires

### 🎒 Preparation Checklist
- [ ] Fire extinguisher
- [ ] Smoke detectors (test monthly)
- [ ] Emergency escape plan
- [ ] Meeting point outside
`,
    hurricane: `
## 🌀 Hurricane Emergency Guide

### 🚨 Immediate Actions
- 📻 Monitor weather updates
- 🏠 Board up windows
- 🧊 Fill containers with water
- 🚗 Know your evacuation route

### ✅ Do's
- ✅ Follow evacuation orders
- ✅ Stay away from windows
- ✅ Use flashlights, not candles
- ✅ Keep refrigerator closed

### ❌ Don'ts
- ❌ Don't go outside during storm
- ❌ Don't drive through water
- ❌ Don't use generators indoors
- ❌ Don't ignore warnings

### 🎒 Preparation Checklist
- [ ] 3 days of water and food
- [ ] Flashlights and batteries
- [ ] Portable phone charger
- [ ] Important documents in waterproof bag
`,
  };

  return guides[disaster.toLowerCase()] || `
## ⚠️ ${disaster.charAt(0).toUpperCase() + disaster.slice(1)} Emergency Guide

### 🚨 Immediate Actions
- Stay calm and assess the situation
- Follow local emergency instructions
- Move to safety if in immediate danger

### ✅ Do's
- ✅ Stay informed via official channels
- ✅ Check on others if safe
- ✅ Prepare for potential evacuation
- ✅ Document any damage

### ❌ Don'ts
- ❌ Don't panic
- ❌ Don't spread unverified information
- ❌ Don't put yourself at unnecessary risk
- ❌ Don't return home until declared safe

### 🎒 Preparation Checklist
- [ ] Emergency kit ready
- [ ] Important documents secured
- [ ] Communication plan with family
- [ ] Know your nearest shelter
`;
};
