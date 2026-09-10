import { SavedPlaceRepository } from '../repositories/savedPlace.repository.js';
import { PlaceModel } from '../../types/index.js';

export class SavedPlaceService {
  private repo: SavedPlaceRepository;

  constructor(repo?: SavedPlaceRepository) {
    this.repo = repo || new SavedPlaceRepository();
  }

  async savePlace(userId: string, placeId: string): Promise<{ id: string; place: PlaceModel | null }> {
    return this.repo.savePlace(userId, placeId);
  }

  async getSavedPlaces(userId: string): Promise<PlaceModel[]> {
    return this.repo.getSavedPlaces(userId);
  }

  async removeSavedPlace(userId: string, placeId: string): Promise<boolean> {
    return this.repo.removeSavedPlace(userId, placeId);
  }
}
