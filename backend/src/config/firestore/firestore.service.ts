import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Firestore, Settings } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class FirestoreService implements OnModuleInit, OnModuleDestroy {
  private readonly firestore: Firestore;
  private readonly logger = new Logger(FirestoreService.name);
  private tempCredentialsFile?: string;

  constructor(projectId: string) {
    // Handle Google Application Credentials BEFORE creating Firestore instance
    this.handleCredentials();

    const settings: Settings = {
      projectId,
      ignoreUndefinedProperties: true, // Ignore undefined properties instead of throwing errors
    };

    this.firestore = new Firestore(settings);
  }

  private handleCredentials() {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentials) {
      this.logger.log(
        'No GOOGLE_APPLICATION_CREDENTIALS found, using default credentials (Cloud Run service identity)',
      );
      return;
    }

    this.logger.log('GOOGLE_APPLICATION_CREDENTIALS found, processing...');

    // Check if credentials is a JSON string (starts with '{')
    if (credentials.trim().startsWith('{')) {
      try {
        // Parse to validate JSON
        const credentialsObj = JSON.parse(credentials);
        this.logger.log(
          `Parsed credentials for project: ${credentialsObj.project_id}`,
        );
        // Create a temporary file with the credentials
        const tempDir = os.tmpdir();
        this.tempCredentialsFile = path.join(
          tempDir,
          `gcp-credentials-${Date.now()}.json`,
        );
        fs.writeFileSync(this.tempCredentialsFile, credentials);
        // Update the environment variable to point to the file
        process.env.GOOGLE_APPLICATION_CREDENTIALS = this.tempCredentialsFile;
        this.logger.log(
          `Created temporary credentials file: ${this.tempCredentialsFile}`,
        );
      } catch (error) {
        this.logger.error(
          'Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS:',
          error.message,
        );
        this.logger.error(
          'Credentials preview:',
          credentials.substring(0, 100) + '...',
        );
        // Continue without credentials, will use default
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
    } else if (credentials.length > 0) {
      // Assume it's a file path, but check if it exists
      this.logger.log(`Using service account from file path: ${credentials}`);
      if (!fs.existsSync(credentials)) {
        this.logger.error(`Credentials file not found: ${credentials}`);
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
    } else {
      this.logger.warn(
        'Empty GOOGLE_APPLICATION_CREDENTIALS, using default credentials',
      );
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
  }

  async onModuleInit() {
    // Test Firestore connection during startup but don't fail if it doesn't work
    try {
      this.logger.log('Testing Firestore connection...');
      const collections = await this.firestore.listCollections();
      this.logger.log(
        `Firestore connection successful. Found ${collections.length} collections.`,
      );
    } catch (error) {
      this.logger.error(
        'Firestore connection failed during startup:',
        error.message,
      );
      this.logger.warn(
        'Application will continue to start, but Firestore operations may not work',
      );
      // Don't throw error - let the app start and handle Firestore errors per operation
    }
  }

  // Get Firestore instance
  get db(): Firestore {
    return this.firestore;
  }

  // Get a collection reference
  collection(collectionName: string) {
    return this.firestore.collection(collectionName);
  }

  // Create a document with auto-generated ID
  async create<T>(
    collection: string,
    data: T,
  ): Promise<{ id: string; data: T }> {
    const docRef = this.firestore.collection(collection).doc();
    await docRef.set(data);
    return { id: docRef.id, data };
  }

  // Create a document with specified ID
  async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.firestore.collection(collection).doc(id).set(data);
  }

  // Get a document by ID
  async get<T>(collection: string, id: string): Promise<T | null> {
    const doc = await this.firestore.collection(collection).doc(id).get();
    return doc.exists ? (doc.data() as T) : null;
  }

  // Update a document (partial update)
  async update<T>(
    collection: string,
    id: string,
    data: Partial<T>,
  ): Promise<void> {
    await this.firestore.collection(collection).doc(id).update(data);
  }

  // Delete a document
  async delete(collection: string, id: string): Promise<void> {
    await this.firestore.collection(collection).doc(id).delete();
  }

  // Query documents in a collection
  async query<T>(
    collection: string,
    field: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
  ): Promise<T[]> {
    const snapshot = await this.firestore
      .collection(collection)
      .where(field, operator, value)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  // Get all documents in a collection
  async getAll<T>(collection: string): Promise<T[]> {
    const snapshot = await this.firestore.collection(collection).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  async onModuleDestroy() {
    // Clean up temporary credentials file
    if (this.tempCredentialsFile && fs.existsSync(this.tempCredentialsFile)) {
      try {
        fs.unlinkSync(this.tempCredentialsFile);
        this.logger.log('Cleaned up temporary credentials file');
      } catch (error) {
        this.logger.warn(
          'Failed to clean up temporary credentials file:',
          error.message,
        );
      }
    }
  }
}
