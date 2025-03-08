import { Injectable, OnModuleInit } from '@nestjs/common';
import { Firestore, Settings } from '@google-cloud/firestore';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private readonly firestore: Firestore;

  constructor(projectId: string) {
    const settings: Settings = {
      projectId,
      ignoreUndefinedProperties: true, // Ignore undefined properties instead of throwing errors
    };

    this.firestore = new Firestore(settings);
  }

  onModuleInit() {
    // Optional: perform any initialization tasks when the module is loaded
    console.log('Firestore service initialized');
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
}
