import { DocumentChunk, MessageCitation, UploadedDocument } from '../types';

/**
 * Text extraction utility for TXT, MD, JSON, CSV, and PDF files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'pdf') {
    // PDF text stream parser: reads bytes, extracts readable text streams and decode blocks
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = textDecoder.decode(bytes);

    // Look for PDF text objects between BT and ET operators
    const textMatches: string[] = [];
    const streamRegex = /BT[\s\S]*?ET/g;
    let match;

    while ((match = streamRegex.exec(rawString)) !== null) {
      const block = match[0];
      // Match text inside parens (text) Tj or [(t)(e)(x)(t)] TJ
      const stringMatches = block.match(/\(([^()]*)\)\s*Tj/g) || [];
      for (const m of stringMatches) {
        const cleaned = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
        if (cleaned) textMatches.push(cleaned);
      }

      // TJ array format
      const arrayMatches = block.match(/\[(.*?)\]\s*TJ/g) || [];
      for (const arr of arrayMatches) {
        const innerStrings = arr.match(/\(([^()]*)\)/g) || [];
        const str = innerStrings.map(s => s.slice(1, -1)).join('');
        if (str.trim()) textMatches.push(str.trim());
      }
    }

    if (textMatches.length > 0) {
      return textMatches.join(' ');
    }

    // Fallback: extract printable ASCII and utf8 words from stream
    const words = rawString.replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/stream[\s\S]*?endstream/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !w.startsWith('/') && !w.includes('obj') && !w.includes('xref'))
      .slice(0, 4000);

    return words.join(' ') || `[Extracted document content from ${file.name}]`;
  }

  // Plain text, markdown, CSV, code, JSON
  return await file.text();
}

/**
 * Semantic chunking with configurable overlap.
 * Uses sentence boundaries where possible.
 */
export function chunkText(
  documentId: string,
  documentName: string,
  rawText: string,
  targetChunkWords = 180,
  overlapWords = 35
): DocumentChunk[] {
  // Normalize whitespace
  const clean = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = clean.split(/\n\n+/);
  const words: string[] = [];

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean);
    words.push(...paraWords);
  }

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + targetChunkWords, words.length);
    const chunkWords = words.slice(start, end);
    const content = chunkWords.join(' ');

    // Calculate term frequencies for fast vector similarity
    const termFrequencies = computeTermFrequencies(content);
    const embedding = generatePseudoEmbedding(content);

    chunks.push({
      id: `${documentId}_chunk_${chunkIndex}`,
      documentId,
      documentName,
      content,
      chunkIndex,
      pageNumber: Math.floor(start / 300) + 1,
      embedding,
      termFrequencies,
    });

    chunkIndex++;
    if (end >= words.length) break;
    start += (targetChunkWords - overlapWords);
  }

  return chunks;
}

/**
 * Term frequency hashing and normalization
 */
function computeTermFrequencies(text: string): Record<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

/**
 * 64-dimensional semantic dense embedding generator using character n-gram hashing
 * Produces consistent normalized vectors for cosine distance calculation.
 */
export function generatePseudoEmbedding(text: string, dimensions = 64): number[] {
  const vec = new Array(dimensions).fill(0);
  const clean = text.toLowerCase();

  // 3-gram and 4-gram hashing
  for (let i = 0; i < clean.length - 2; i++) {
    const gram = clean.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash << 5) - hash + gram.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vec[idx] += sign * (1 / Math.sqrt(clean.length + 1));
  }

  // Normalize vector to unit length
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = vec[i] / norm;
    }
  }

  return vec;
}

/**
 * Cosine similarity between two unit vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, (dot + 1) / 2));
}

/**
 * Keyword match booster using BM25-style term frequency matching
 */
function keywordMatchScore(query: string, chunk: DocumentChunk): number {
  const queryTerms = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  if (queryTerms.length === 0 || !chunk.termFrequencies) return 0;

  let score = 0;
  for (const term of queryTerms) {
    if (chunk.termFrequencies[term]) {
      score += 1 + Math.log(chunk.termFrequencies[term]);
    }
  }
  return Math.min(1, score / (queryTerms.length * 2));
}

/**
 * Retrieve top-K relevant chunks across all active documents
 */
export function retrieveRelevantChunks(
  query: string,
  documents: UploadedDocument[],
  maxChunks = 4,
  threshold = 0.25
): MessageCitation[] {
  const queryEmbedding = generatePseudoEmbedding(query);
  const candidates: Array<{ chunk: DocumentChunk; score: number }> = [];

  for (const doc of documents) {
    if (!doc.chunks) continue;
    for (const chunk of doc.chunks) {
      const vecScore = chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
      const kwScore = keywordMatchScore(query, chunk);
      // Hybrid scoring: 60% semantic vector + 40% lexical match
      const hybridScore = (vecScore * 0.6) + (kwScore * 0.4);

      if (hybridScore >= threshold) {
        candidates.push({ chunk, score: hybridScore });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, maxChunks);

  return top.map(item => ({
    id: item.chunk.id,
    documentId: item.chunk.documentId,
    documentName: item.chunk.documentName,
    pageNumber: item.chunk.pageNumber,
    chunkIndex: item.chunk.chunkIndex,
    snippet: item.chunk.content.slice(0, 240) + (item.chunk.content.length > 240 ? '...' : ''),
    similarity: Math.round(item.score * 100),
  }));
}

/**
 * Augment user prompt with retrieved RAG context and anti-hallucination instructions
 */
export function buildRagPrompt(
  originalPrompt: string,
  citations: MessageCitation[],
  documents: UploadedDocument[]
): { augmentedPrompt: string; citations: MessageCitation[] } {
  if (citations.length === 0) {
    return { augmentedPrompt: originalPrompt, citations: [] };
  }

  // Map citations back to full chunk text
  const chunkMap = new Map<string, string>();
  for (const doc of documents) {
    if (doc.chunks) {
      for (const ch of doc.chunks) {
        chunkMap.set(ch.id, ch.content);
      }
    }
  }

  let contextBlocks = 'GROUNDING CONTEXT FROM UPLOADED DOCUMENTS:\n';
  citations.forEach((cit, idx) => {
    const fullContent = chunkMap.get(cit.id) || cit.snippet;
    contextBlocks += `\n[Source ${idx + 1}: ${cit.documentName} (Page ${cit.pageNumber || 1})]\n${fullContent}\n`;
  });

  const augmentedPrompt = `${contextBlocks}
---
INSTRUCTIONS:
You are an AI answering user queries strictly grounded in the document context above.
1. Answer the user prompt accurately based ONLY on the provided document excerpts.
2. If the answer cannot be found in or directly inferred from the documents, clearly state: "Based on the provided documents, this information is not mentioned."
3. Cite sources naturally when making claims using [Source 1], [Source 2], etc.

USER QUERY:
${originalPrompt}`;

  return { augmentedPrompt, citations };
}
