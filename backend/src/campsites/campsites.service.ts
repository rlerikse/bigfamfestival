import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { CreateCampsiteDto } from './dto/create-campsite.dto';
import { Campsite } from './interfaces/campsite.interface';
import { FieldValue } from '@google-cloud/firestore';

@Injectable()
export class CampsitesService {
  private readonly collection = 'campsites';

  constructor(private readonly firestoreService: FirestoreService) {}

  async upsert(userId: string, createCampsiteDto: CreateCampsiteDto): Promise<Campsite> {
    try {
      const campsiteRef = this.firestoreService.db.collection(this.collection).doc(userId);
      const now = new Date();
      const campsiteData: Omit<Campsite, 'id' | 'createdAt'> & { createdAt?: FieldValue, updatedAt: FieldValue } = {
        userId,
        ...createCampsiteDto,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const doc = await campsiteRef.get();
      if (!doc.exists) {
        campsiteData.createdAt = FieldValue.serverTimestamp();
      }

      await campsiteRef.set(campsiteData, { merge: true });
      
      // Retrieve the data to return the full object with timestamps
      const updatedDoc = await campsiteRef.get();
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt.toDate ? data.createdAt.toDate() : now, // Handle server timestamp
        updatedAt: data.updatedAt.toDate ? data.updatedAt.toDate() : now, // Handle server timestamp
      } as Campsite;
    } catch (error) {
      console.error('Error in upsert campsite:', error);
      throw new InternalServerErrorException('Could not create or update campsite.');
    }
  }

  async findByUserId(userId: string): Promise<Campsite | null> {
    try {
      const doc = await this.firestoreService.db.collection(this.collection).doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt.toDate(), // Convert Timestamp to Date
        updatedAt: data.updatedAt.toDate(), // Convert Timestamp to Date
      } as Campsite;
    } catch (error) {
      console.error('Error in findByUserId campsite:', error);
      throw new InternalServerErrorException('Could not retrieve campsite.');
    }
  }

  async remove(userId: string): Promise<void> {
    try {
      const docRef = this.firestoreService.db.collection(this.collection).doc(userId);
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new NotFoundException(`Campsite for user ID ${userId} not found.`);
      }
      await docRef.delete();
    } catch (error) {
      console.error('Error in remove campsite:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Could not delete campsite.');
    }
  }
}
