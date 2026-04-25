import { Request, Response } from 'express';
import { getWeatherAndAQI } from '../services/weatherService';

export const getWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ message: 'Latitude and longitude are required' });
      return;
    }

    const weather = await getWeatherAndAQI(parseFloat(lat as string), parseFloat(lng as string));
    res.json(weather);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weather', error: (error as Error).message });
  }
};
