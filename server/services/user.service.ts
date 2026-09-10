import { UserRepository } from '../repositories/user.repository.js';
import { UserProfile, UserPreferenceData } from '../../types/index.js';

export class UserService {
  private userRepo: UserRepository;

  constructor(userRepo?: UserRepository) {
    this.userRepo = userRepo || new UserRepository();
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('NOT_FOUND: User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateProfile(userId: string, data: { name?: string; image?: string | null }): Promise<UserProfile> {
    const updated = await this.userRepo.update(userId, data);
    if (!updated) {
      throw new Error('NOT_FOUND: User not found');
    }
    return updated;
  }

  async getPreferences(userId: string): Promise<UserPreferenceData> {
    return this.userRepo.getPreferences(userId);
  }

  async updatePreferences(userId: string, data: Partial<UserPreferenceData>): Promise<UserPreferenceData> {
    return this.userRepo.upsertPreferences(userId, data);
  }
}
