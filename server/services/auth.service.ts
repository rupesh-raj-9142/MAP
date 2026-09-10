import { UserRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { AuthResponse, UserProfile } from '../../types/index.js';

export class AuthService {
  private userRepo: UserRepository;

  constructor(userRepo?: UserRepository) {
    this.userRepo = userRepo || new UserRepository();
  }

  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('USER_EXISTS: An account with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash
    });

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user,
      token
    };
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS: Invalid email or password');
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS: Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email });

    const userProfile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return {
      user: userProfile,
      token
    };
  }

  async getCurrentUser(userId: string): Promise<UserProfile> {
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
}
