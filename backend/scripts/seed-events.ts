import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EventsService } from '../src/events/events.service';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

// Mock events data from HomeScreen.tsx
const mockEvents = [
  {
    name: 'CASPA',
    stage: 'Apogee',
    date: '2025-09-26',
    startTime: '22:00',
    endTime: '23:30',
    artists: ['CASPA'],
    description: 'Heavyweight dubstep sounds from the legend CASPA.',
    imageUrl: 'https://images.bigfamfestival.com/artists/caspa.jpg',
  },
  {
    name: 'SAKA',
    stage: 'The Bayou',
    date: '2025-09-26',
    startTime: '20:30',
    endTime: '21:45',
    artists: ['SAKA'],
    description: 'Innovative bass music explorations.',
    imageUrl: 'https://images.bigfamfestival.com/artists/saka.jpg',
  },
  {
    name: 'LYNY',
    stage: 'Apogee',
    date: '2025-09-27',
    startTime: '22:30',
    endTime: '00:00',
    artists: ['LYNY'],
    description: 'Genre-bending bass and experimental beats.',
    imageUrl: 'https://images.bigfamfestival.com/artists/lyny.jpg',
  },
  {
    name: 'TERNION SOUND (Farewell Tour)',
    stage: 'The Bayou',
    date: '2025-09-27',
    startTime: '21:00',
    endTime: '22:15',
    artists: ['TERNION SOUND'],
    description: "Don't miss the legendary Ternion Sound, farewell.",
    imageUrl: 'https://images.bigfamfestival.com/artists/ternion_sound.jpg',
  },
  {
    name: 'THE WIDDLER',
    stage: 'Apogee',
    date: '2025-09-28',
    startTime: '21:30',
    endTime: '23:00',
    artists: ['THE WIDDLER'],
    description: 'Deep dubstep vibrations.',
    imageUrl: 'https://images.bigfamfestival.com/artists/the_widdler.jpg',
  },
  {
    name: 'KHIVA',
    stage: 'The Bayou',
    date: '2025-09-28',
    startTime: '20:00',
    endTime: '21:15',
    artists: ['KHIVA'],
    description: 'Dark and powerful bass music.',
    imageUrl: 'https://images.bigfamfestival.com/artists/khiva.jpg',
  },
  {
    name: 'PROBCAUSE (DJ SET)',
    stage: 'The Art Tent',
    date: '2025-09-26',
    startTime: '19:00',
    endTime: '20:15',
    artists: ['PROBCAUSE'],
    description: 'Eclectic DJ set from ProbCause.',
    imageUrl: 'https://images.bigfamfestival.com/artists/probcause.jpg',
  },
  {
    name: 'SUPER FUTURE X2',
    stage: 'The Art Tent',
    date: '2025-09-27',
    startTime: '19:30',
    endTime: '20:45',
    artists: ['SUPER FUTURE'],
    description: "Double dose of Super Future's unique sound.",
    imageUrl: 'https://images.bigfamfestival.com/artists/super_future.jpg',
  },
  {
    name: 'JASON LEECH',
    stage: 'The Art Tent',
    date: '2025-09-28',
    startTime: '18:30',
    endTime: '19:45',
    artists: ['JASON LEECH'],
    description: 'Live electronic performance.',
    imageUrl: 'https://images.bigfamfestival.com/artists/jason_leech.jpg',
  },
  {
    name: 'CANVAS',
    stage: 'The Bayou',
    date: '2025-09-26',
    startTime: '17:00',
    endTime: '18:00',
    artists: ['CANVAS'],
    description: 'Artistic bass music.',
    imageUrl: 'https://images.bigfamfestival.com/artists/canvas.jpg',
  },
  {
    name: 'OZZTIN',
    stage: 'Apogee',
    date: '2025-09-27',
    startTime: '18:00',
    endTime: '19:00',
    artists: ['OZZTIN'],
    description: 'Energetic bass performance.',
    imageUrl: 'https://images.bigfamfestival.com/artists/ozztin.jpg',
  },
  {
    name: 'YOKO',
    stage: 'The Art Tent',
    date: '2025-09-28',
    startTime: '17:00',
    endTime: '18:00',
    artists: ['YOKO'],
    description: 'Unique soundscapes.',
    imageUrl: 'https://images.bigfamfestival.com/artists/yoko.jpg',
  },
];

async function bootstrap() {
  console.log('🚀 Starting event seeding process...');
  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    // Get services
    const eventsService = app.get(EventsService);
    const authService = app.get(AuthService);
    const usersService = app.get(UsersService);
    console.log('📝 Services loaded successfully');
    // Create or get admin user for seeding
    let adminUser;
    const adminEmail = 'admin@bigfamfestival.com';
    try {
      adminUser = await usersService.findByEmail(adminEmail);
      console.log('👤 Found existing admin user');
    } catch (error) {
      console.log('👤 Creating admin user for seeding...');

      // Create admin user
      const hashedPassword = await bcrypt.hash('SeederAdmin123!', 10);
      adminUser = await usersService.create({
        email: adminEmail,
        password: hashedPassword,
        name: 'Event Seeder Admin',
        role: Role.ADMIN,
        shareMyCampsite: false,
        shareMyLocation: false,
        ticketType: 'admin',
      });
      console.log('✅ Admin user created successfully');
    }
    console.log(`📅 Starting to seed ${mockEvents.length} events...`);
    let successCount = 0;
    let errorCount = 0;
    // Seed each event
    for (const [index, eventData] of mockEvents.entries()) {
      try {
        console.log(`⏳ Processing event ${index + 1}
            /${mockEvents.length}: ${eventData.name}`);
        // Create event with admin user as creator
        const createdEvent = await eventsService.create({
          ...eventData,
          createdBy: adminUser.id,
        });
        console.log(`✅ Created event: ${createdEvent.name}
             (ID: ${createdEvent.id})`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to create event ${eventData.name}:`,
          error instanceof Error ? error.message : String(error),
        );
        errorCount++;
      }
    }
    console.log('\n📊 Seeding completed!');
    console.log(`✅ Successfully created: ${successCount} events`);
    console.log(`❌ Failed to create: ${errorCount} events`);

    if (errorCount === 0) {
      console.log('🎉 All events seeded successfully!');
    } else {
      console.log('⚠️  Some events failed to seed. Check the errors above.');
    }
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    // Close the application context
    await app.close();
    console.log('🔒 Application context closed');
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the seeding script
bootstrap().catch((error) => {
  console.error('❌ Seeding script failed:', error);
  process.exit(1);
});
