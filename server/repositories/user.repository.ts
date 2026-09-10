import { UserProfile, UserPreferenceData } from '../../types/index.js';
import { getPrismaClient, isDatabaseActive } from './db.js';

interface InMemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  preference?: UserPreferenceData;
}

const memoryUsers = new Map<string, InMemoryUser>();

export class UserRepository {
  async findByEmail(email: string): Promise<InMemoryUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const user = await client.user.findUnique({
          where: { email: normalizedEmail },
          include: { preference: true }
        });
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          preference: user.preference ? {
            userId: user.preference.userId,
            interests: user.preference.interests,
            budgetPreference: user.preference.budgetPreference,
            travelStyle: user.preference.travelStyle,
            transportPreference: user.preference.transportPreference,
            favoriteCategories: user.preference.favoriteCategories
          } : undefined
        };
      } catch {
        // Fallback to memory
      }
    }

    for (const u of memoryUsers.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        return u;
      }
    }
    return null;
  }

  async findById(id: string): Promise<InMemoryUser | null> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const user = await client.user.findUnique({
          where: { id },
          include: { preference: true }
        });
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          preference: user.preference ? {
            userId: user.preference.userId,
            interests: user.preference.interests,
            budgetPreference: user.preference.budgetPreference,
            travelStyle: user.preference.travelStyle,
            transportPreference: user.preference.transportPreference,
            favoriteCategories: user.preference.favoriteCategories
          } : undefined
        };
      } catch {
        // Fallback to memory
      }
    }

    return memoryUsers.get(id) || null;
  }

  async create(data: { name: string; email: string; passwordHash: string; image?: string }): Promise<UserProfile> {
    const normalizedEmail = data.email.toLowerCase().trim();
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const created = await client.user.create({
          data: {
            name: data.name,
            email: normalizedEmail,
            passwordHash: data.passwordHash,
            image: data.image
          }
        });
        return {
          id: created.id,
          name: created.name,
          email: created.email,
          image: created.image,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        };
      } catch {
        // Fallback to memory
      }
    }

    const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = new Date();
    const newUser: InMemoryUser = {
      id,
      name: data.name,
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      image: data.image || null,
      createdAt: now,
      updatedAt: now
    };
    memoryUsers.set(id, newUser);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      image: newUser.image,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
  }

  async update(id: string, data: { name?: string; image?: string | null }): Promise<UserProfile | null> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const updated = await client.user.update({
          where: { id },
          data
        });
        return {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          image: updated.image,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        };
      } catch {
        // Fallback to memory
      }
    }

    const user = memoryUsers.get(id);
    if (!user) return null;
    if (data.name !== undefined) user.name = data.name;
    if (data.image !== undefined) user.image = data.image;
    user.updatedAt = new Date();
    memoryUsers.set(id, user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async getPreferences(userId: string): Promise<UserPreferenceData> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const pref = await client.userPreference.findUnique({
          where: { userId }
        });
        if (pref) {
          return {
            id: pref.id,
            userId: pref.userId,
            interests: pref.interests,
            budgetPreference: pref.budgetPreference,
            travelStyle: pref.travelStyle,
            transportPreference: pref.transportPreference,
            favoriteCategories: pref.favoriteCategories
          };
        }
      } catch {
        // Fallback to memory
      }
    }

    const user = memoryUsers.get(userId);
    return user?.preference || {
      userId,
      interests: ['history', 'culture'],
      budgetPreference: '₹₹',
      travelStyle: 'balanced',
      transportPreference: 'walking',
      favoriteCategories: ['history', 'nature']
    };
  }

  async upsertPreferences(userId: string, data: Partial<UserPreferenceData>): Promise<UserPreferenceData> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const pref = await client.userPreference.upsert({
          where: { userId },
          update: {
            interests: data.interests || [],
            budgetPreference: data.budgetPreference,
            travelStyle: data.travelStyle,
            transportPreference: data.transportPreference,
            favoriteCategories: data.favoriteCategories || []
          },
          create: {
            userId,
            interests: data.interests || [],
            budgetPreference: data.budgetPreference,
            travelStyle: data.travelStyle,
            transportPreference: data.transportPreference,
            favoriteCategories: data.favoriteCategories || []
          }
        });
        return {
          id: pref.id,
          userId: pref.userId,
          interests: pref.interests,
          budgetPreference: pref.budgetPreference,
          travelStyle: pref.travelStyle,
          transportPreference: pref.transportPreference,
          favoriteCategories: pref.favoriteCategories
        };
      } catch {
        // Fallback to memory
      }
    }

    const user = memoryUsers.get(userId);
    const existing = user?.preference || {
      userId,
      interests: [],
      favoriteCategories: []
    };

    const updated: UserPreferenceData = {
      ...existing,
      ...data,
      userId
    };

    if (user) {
      user.preference = updated;
      memoryUsers.set(userId, user);
    }

    return updated;
  }
}
