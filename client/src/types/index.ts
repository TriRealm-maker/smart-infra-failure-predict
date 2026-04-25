export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WeatherData {
  temperature: string;
  condition: string;
  aqi: string;
  humidity: string;
  windSpeed: string;
  locationName: string;
}

export interface MedicalFile {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}

export interface MedicalProfile {
  fullName: string;
  dob: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  files: MedicalFile[];
}

export interface NearbyPlace {
  id: string;
  title: string;
  type: 'hospital' | 'clinic' | 'doctors' | 'police' | 'fire' | 'pharmacy' | 'atm' | 'gas_station' | 'ambulance' | 'shelter' | 'other';
  lat: number;
  lng: number;
  address: string;
  phoneNumber?: string;
  operatingHours?: string;
  distance?: number;
}

export type DisasterType = 'earthquake' | 'flood' | 'fire' | 'hurricane' | 'tornado' | 'tsunami';

export interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
}
