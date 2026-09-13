import { Injectable, Logger } from '@nestjs/common';

export interface EmbedImageResult {
  itemImageId: string;
  vector: number[];
  modelName: string;
  ocrText?: string;
}

export interface EmbedTextResult {
  vector: number[];
  modelName: string;
}

export interface ScorePairResult {
  visualScore: number;
  textScore: number;
  attributeScore: number;
  ocrScore: number;
}

/**
 * Thin HTTP client for the Python FastAPI ML service. Kept deliberately
 * dumb - all model-specific logic (which vision encoder, which OCR engine,
 * etc.) lives in the ML service so it can evolve independently of the
 * Node/NestJS codebase, per the "replaceable adapters" requirement.
 */
@Injectable()
export class MlClientService {
  private readonly logger = new Logger('MlClientService');
  private readonly baseUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';

  async embedImage(imageUrl: string, itemImageId: string): Promise<EmbedImageResult> {
    const res = await fetch(`${this.baseUrl}/v1/embed/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, item_image_id: itemImageId }),
    });
    if (!res.ok) throw new Error(`ML embed/image failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      itemImageId,
      vector: data.vector,
      modelName: data.model_name,
      ocrText: data.ocr_text,
    };
  }

  async embedText(text: string): Promise<EmbedTextResult> {
    const res = await fetch(`${this.baseUrl}/v1/embed/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`ML embed/text failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return { vector: data.vector, modelName: data.model_name };
  }

  async scoreCandidate(payload: {
    lostImageVectors: number[][];
    foundImageVectors: number[][];
    lostText: string;
    foundText: string;
    lostAttributes: Record<string, unknown>;
    foundAttributes: Record<string, unknown>;
    lostOcrText: string[];
    foundOcrText: string[];
  }): Promise<ScorePairResult> {
    const res = await fetch(`${this.baseUrl}/v1/match/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lost_image_vectors: payload.lostImageVectors,
        found_image_vectors: payload.foundImageVectors,
        lost_text: payload.lostText,
        found_text: payload.foundText,
        lost_attributes: payload.lostAttributes,
        found_attributes: payload.foundAttributes,
        lost_ocr_text: payload.lostOcrText,
        found_ocr_text: payload.foundOcrText,
      }),
    });
    if (!res.ok) throw new Error(`ML match/score failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      visualScore: data.visual_score,
      textScore: data.text_score,
      attributeScore: data.attribute_score,
      ocrScore: data.ocr_score,
    };
  }
}
