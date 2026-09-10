import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_PLACES } from '../server/integrations/places/seedData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting YATRA Database Seeding...');

  // 1. Seed Demo User
  const passwordHash = await bcrypt.hash('Traveler@123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'traveler@yatra.in' },
    update: {},
    create: {
      name: 'Aarav Sharma',
      email: 'traveler@yatra.in',
      passwordHash,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      preference: {
        create: {
          interests: ['history', 'culture', 'food'],
          budgetPreference: '₹₹',
          travelStyle: 'balanced',
          transportPreference: 'walking',
          favoriteCategories: ['history', 'nature', 'spiritual']
        }
      }
    }
  });
  console.log(`✅ Seeded demo user: ${demoUser.email} (id: ${demoUser.id})`);

  // 2. Seed Factual Places across Patna, Delhi, Varanasi, Jaipur, Mumbai, Kolkata
  let placesCount = 0;
  for (const place of SEED_PLACES) {
    await prisma.place.upsert({
      where: { externalId: place.externalId || place.id },
      update: {
        name: place.name,
        description: place.description,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        rating: place.rating,
        reviewCount: place.reviewCount,
        phoneNumber: place.phoneNumber,
        website: place.website,
        openingHours: place.openingHours,
        priceLevel: place.priceLevel,
        entryFee: place.entryFee,
        recommendedDuration: place.recommendedDuration,
        photos: place.photos,
        source: place.source
      },
      create: {
        id: place.id,
        externalId: place.externalId || place.id,
        name: place.name,
        description: place.description,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        rating: place.rating,
        reviewCount: place.reviewCount,
        phoneNumber: place.phoneNumber,
        website: place.website,
        openingHours: place.openingHours,
        priceLevel: place.priceLevel,
        entryFee: place.entryFee,
        recommendedDuration: place.recommendedDuration,
        photos: place.photos,
        source: place.source
      }
    });
    placesCount++;
  }
  console.log(`✅ Seeded ${placesCount} verified places across 6 major Indian hubs.`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
