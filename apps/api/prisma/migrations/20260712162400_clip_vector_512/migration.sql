-- Align ImageEmbedding vector dimension with
-- openai/clip-vit-base-patch32 output dimension.

ALTER TABLE "image_embeddings"
ALTER COLUMN "vector" TYPE vector(512);
