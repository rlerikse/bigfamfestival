import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Module({
  imports: [ConfigModule],
  providers: [],
  exports: [], // No need to export providers as we're initializing Firebase Admin globally
})
export class FirebaseAdminModule implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminModule.name);
  private tempCredentialsFile?: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Skip initialization if Firebase Admin is already initialized
    if (admin.apps.length > 0) {
      this.logger.log('Firebase Admin SDK already initialized');
      return;
    }

    try {
      const projectId = this.configService.get<string>('GOOGLE_PROJECT_ID');
      const storageBucket = this.configService.get<string>('STORAGE_BUCKET');
      const credentials = this.configService.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      );

      // Prepare credentials
      let serviceAccount;
      if (credentials) {
        if (credentials.trim().startsWith('{')) {
          // Credentials provided as JSON string
          try {
            serviceAccount = JSON.parse(credentials);

            // Create a temporary file for credentials if needed
            const tempDir = os.tmpdir();
            this.tempCredentialsFile = path.join(
              tempDir,
              `firebase-credentials-${Date.now()}.json`,
            );
            fs.writeFileSync(this.tempCredentialsFile, credentials);

            // Initialize with the temporary file path
            admin.initializeApp({
              credential: admin.credential.cert(this.tempCredentialsFile),
              projectId,
              storageBucket: `${storageBucket}`,
            });
          } catch (error) {
            this.logger.error(
              'Error parsing Firebase credentials JSON:',
              error,
            );
            throw error;
          }
        } else if (fs.existsSync(credentials)) {
          // Credentials provided as file path
          admin.initializeApp({
            credential: admin.credential.cert(credentials),
            projectId,
            storageBucket: `${storageBucket}`,
          });
        } else {
          this.logger.error(`Credentials file not found: ${credentials}`);
          throw new Error(
            `Firebase credentials file not found: ${credentials}`,
          );
        }
      } else {
        // No explicit credentials, use default credentials (for Cloud Run, etc.)
        admin.initializeApp({
          projectId,
          storageBucket: `${storageBucket}`,
        });
      }

      this.logger.log('Firebase Admin SDK initialized successfully');

      // We'll skip FCM verification during initialization to avoid permission issues
      // Instead, we'll let the notifications service check FCM when needed
      this.logger.log(
        'Note: FCM verification is skipped during initialization to avoid permission issues',
      );

      // Log a warning about FCM permissions if in development mode
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          'To use FCM, ensure your service account has the "Firebase Cloud Messaging Admin" role. ' +
            'You can check this in the Google Cloud Console under IAM & Admin.',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }
}
