import { Request, Response } from 'express';
import { findNearbyPlaces } from '../services/placesService';

export const getPlaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, types, radius } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ message: 'Latitude and longitude are required' });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusMeters = radius ? parseFloat(radius as string) : 5000;

    let typeList: string[] = [];
    if (types) {
      typeList = typeof types === 'string' ? types.split(',') : types as string[];
    } else {
      typeList = ['hospital', 'pharmacy', 'police', 'fire_station', 'atm', 'gas_station'];
    }

    console.log(`Fetching places for lat=${latitude}, lng=${longitude}, types=${typeList.join(', ')}, radius=${radiusMeters}`);

    const places = await findNearbyPlaces(
      latitude,
      longitude,
      typeList,
      radiusMeters
    );

    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching places', error: (error as Error).message });
  }
};
