import { Injectable } from '@nestjs/common';
import { Client } from '@googlemaps/google-maps-services-js';

@Injectable()
export class MapsService {
  private readonly client = new Client({});

  async getDirections(
    origin: string,
    destination: string,
  ) {
    const response = await this.client.directions({
      params: {
        origin,
        destination,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    return response.data.routes[0] ?? null;
  }

  async getDistance(
    origin: string,
    destination: string,
  ) {
    const response = await this.client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    return response.data.rows[0].elements[0];
  }
}
