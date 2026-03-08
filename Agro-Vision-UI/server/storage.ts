import type { InsertAnalysis, Analysis } from "@shared/schema";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
}

class MemoryStorage implements IStorage {
  private analyses = new Map<number, Analysis>();
  private nextId = 1;

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const record: Analysis = {
      id: this.nextId++,
      imageUrl: analysis.imageUrl,
      diseaseName: analysis.diseaseName,
      confidence: analysis.confidence,
      severity: analysis.severity,
      treatmentTime: analysis.treatmentTime,
      treatment: analysis.treatment,
      precautions: analysis.precautions,
      pesticides: analysis.pesticides,
      modelName: analysis.modelName,
      language: analysis.language ?? "en",
      createdAt: new Date(),
    };

    this.analyses.set(record.id, record);
    return record;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }
}

export const storage = new MemoryStorage();
