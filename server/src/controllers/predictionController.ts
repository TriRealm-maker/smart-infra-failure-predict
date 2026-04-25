import { Request, Response } from 'express';
import { getDisasterPrediction, getDisasterGuide, AssetType } from '../services/aiService';
import { getWeatherAndAQI } from '../services/weatherService';

const assetTypes: AssetType[] = ['building', 'bridge', 'tower'];

export const getPrediction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, assetType } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ message: 'Latitude and longitude are required' });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
      return;
    }

    const selectedAssetType = (assetType as string | undefined)?.toLowerCase() as AssetType | undefined;
    const normalizedAssetType = selectedAssetType && assetTypes.includes(selectedAssetType)
      ? selectedAssetType
      : 'building';

    const weather = await getWeatherAndAQI(latitude, longitude);
    const prediction = await getDisasterPrediction(
      latitude,
      longitude,
      {
        assetType: normalizedAssetType,
        weather,
      }
    );

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: 'Error generating prediction', error: (error as Error).message });
  }
};

export const getGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { disaster } = req.query;

    if (!disaster) {
      res.status(400).json({ message: 'Disaster type is required' });
      return;
    }

    const guide = await getDisasterGuide(disaster as string);
    res.json({ guide });
  } catch (error) {
    res.status(500).json({ message: 'Error generating guide', error: (error as Error).message });
  }
};
