import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bigfamfestival.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

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
    description:
      "Don't miss the legendary Ternion Sound on their farewell tour.",
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

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface CreateEventResponse {
  id: string;
  name: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  artists: string[];
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

async function getAdminToken(): Promise<string> {
  console.log('🔑 Authenticating admin user...');
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    console.log('✅ Admin authentication successful');
    return response.data.token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error(
          'Invalid admin credentials. Please check ADMIN_EMAIL and ADMIN_PASSWORD environment variables.',
        );
      }
      throw new Error(
        `Authentication failed: ${
          error.response?.data?.message || error.message
        }`,
      );
    }
    throw error;
  }
}

async function createEvent(
  token: string,
  eventData: any,
): Promise<CreateEventResponse> {
  try {
    const response = await apiClient.post<CreateEventResponse>(
      '/events',
      eventData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to create event: ${
          error.response?.data?.message || error.message
        }`,
      );
    }
    throw error;
  }
}

async function testHealthEndpoint(): Promise<boolean> {
  console.log('🏥 Testing backend health...');
  try {
    await apiClient.get('/health');
    console.log('✅ Backend health check passed');
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed');
    if (axios.isAxiosError(error)) {
      console.log(`   Status: ${error.response?.status}`);
      console.log(
        `   Error: ${error.response?.data?.message || error.message}`,
      );
    }
    return false;
  }
}

async function seedEventsViaAPI() {
  console.log('🚀 Starting API-based event seeding...');
  console.log(`📡 Target API: ${API_BASE_URL}`);
  // Test health endpoint first
  const isHealthy = await testHealthEndpoint();
  if (!isHealthy) {
    console.log(
      '⚠️  Backend appears to be unhealthy, but continuing with seeding attempt...',
    );
  }
  try {
    // Get admin authentication token
    const token = await getAdminToken();
    console.log(`📅 Starting to seed ${mockEvents.length} events...`);
    let successCount = 0;
    let errorCount = 0;
    // Seed each event
    for (const [index, eventData] of mockEvents.entries()) {
      try {
        console.log(
          `⏳ Processing event ${index + 1}/${mockEvents.length}: ${
            eventData.name
          }`,
        );

        const createdEvent = await createEvent(token, eventData);

        console.log(
          `✅ Created event: ${createdEvent.name} (ID: ${createdEvent.id})`,
        );
        successCount++;

        // Add a small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100));
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
    console.error(
      '💥 Fatal error during seeding:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the seeding script
seedEventsViaAPI().catch((error) => {
  console.error('❌ API seeding script failed:', error);
  process.exit(1);
});
