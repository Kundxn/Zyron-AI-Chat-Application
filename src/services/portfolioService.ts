export interface PortfolioFile {
  path: string;
  category: 'Entity' | 'Service' | 'Controller' | 'Repository' | 'Config' | 'Docker' | 'SQL';
  language: 'java' | 'yaml' | 'sql' | 'dockerfile';
  description: string;
  content: string;
}

export const SPRING_BOOT_PORTFOLIO_FILES: PortfolioFile[] = [
  {
    path: 'src/main/java/com/localmind/LocalMindApplication.java',
    category: 'Config',
    language: 'java',
    description: 'Spring Boot 3.3.0 main entry point with async and reactive support',
    content: `package com.localmind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties
public class LocalMindApplication {

    public static void main(String[] args) {
        SpringApplication.run(LocalMindApplication.class, args);
    }
}
`,
  },
  {
    path: 'src/main/resources/application.yml',
    category: 'Config',
    language: 'yaml',
    description: 'Application configuration for PostgreSQL, pgvector, Ollama REST API, and JWT security',
    content: `spring:
  application:
    name: localmind-backend
  datasource:
    url: jdbc:postgresql://localhost:5432/localmind_db
    username: \${DB_USERNAME:postgres}
    password: \${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB

ollama:
  base-url: \${OLLAMA_BASE_URL:http://localhost:11434}
  default-model: llama3:8b
  connection-timeout-ms: 5000
  read-timeout-ms: 120000

jwt:
  secret: \${JWT_SECRET:localmind_super_secure_jwt_secret_key_with_at_least_256_bits_length_here_12345}
  expiration-ms: 86400000

server:
  port: 8080
`,
  },
  {
    path: 'src/main/resources/schema.sql',
    category: 'SQL',
    language: 'sql',
    description: 'PostgreSQL DDL with pgvector extension, HNSW vector indexing, and relational tables',
    content: `-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ROLE_USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    token_count INT,
    duration_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded Documents Table
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    chunk_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document Chunks with pgvector (768 or 1024 dimensions)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES uploaded_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT,
    content TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW Vector Index for sub-millisecond cosine distance lookups
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
`,
  },
  {
    path: 'src/main/java/com/localmind/entity/Conversation.java',
    category: 'Entity',
    language: 'java',
    description: 'JPA entity modeling user chat sessions with cascade associations',
    content: `package com.localmind;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(nullable = false)
    private Float temperature = 0.7f;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
`,
  },
  {
    path: 'src/main/java/com/localmind/entity/DocumentChunk.java',
    category: 'Entity',
    language: 'java',
    description: 'JPA entity mapping document chunks with pgvector column',
    content: `package com.localmind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private UploadedDocument document;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // pgvector representation as float array
    @Column(name = "embedding", columnDefinition = "vector(768)")
    private float[] embedding;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
`,
  },
  {
    path: 'src/main/java/com/localmind/service/OllamaService.java',
    category: 'Service',
    language: 'java',
    description: 'Reactive WebClient service communicating with Ollama REST API and streaming SSE tokens',
    content: `package com.localmind.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OllamaService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("\${ollama.base-url}")
    private String ollamaBaseUrl;

    public Flux<String> streamChat(String model, List<Map<String, String>> messages, Double temperature) {
        WebClient client = webClientBuilder.baseUrl(ollamaBaseUrl).build();

        Map<String, Object> payload = Map.of(
            "model", model,
            "messages", messages,
            "stream", true,
            "options", Map.of("temperature", temperature != null ? temperature : 0.7)
        );

        return client.post()
            .uri("/api/chat")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(payload)
            .retrieve()
            .bodyToFlux(String.class)
            .map(line -> {
                try {
                    var node = objectMapper.readTree(line);
                    return node.path("message").path("content").asText("");
                } catch (Exception e) {
                    return "";
                }
            })
            .filter(text -> !text.isEmpty());
    }

    public float[] generateEmbedding(String model, String text) {
        WebClient client = webClientBuilder.baseUrl(ollamaBaseUrl).build();

        Map<String, Object> payload = Map.of(
            "model", model,
            "prompt", text
        );

        Map<?, ?> response = client.post()
            .uri("/api/embeddings")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(Map.class)
            .block();

        if (response != null && response.containsKey("embedding")) {
            List<Double> list = (List<Double>) response.get("embedding");
            float[] vector = new float[list.size()];
            for (int i = 0; i < list.size(); i++) {
                vector[i] = list.get(i).floatValue();
            }
            return vector;
        }
        return new float[0];
    }
}
`,
  },
  {
    path: 'src/main/java/com/localmind/service/DocumentProcessingService.java',
    category: 'Service',
    language: 'java',
    description: 'Apache Tika document parser, recursive chunker, and vector embedding generator',
    content: `package com.localmind.service;

import com.localmind.entity.DocumentChunk;
import com.localmind.entity.UploadedDocument;
import com.localmind.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentProcessingService {

    private final Tika tika = new Tika();
    private final OllamaService ollamaService;
    private final DocumentChunkRepository chunkRepository;

    @Transactional
    public List<DocumentChunk> processAndIndexDocument(UploadedDocument document, MultipartFile file) throws Exception {
        log.info("Extracting text via Apache Tika from file: {}", file.getOriginalFilename());
        String text;
        try (InputStream stream = file.getInputStream()) {
            text = tika.parseToString(stream);
        }

        // Recursive Chunking: 400 words with 50-word sliding overlap
        String[] words = text.replaceAll("\\r\\n", "\n").split("\\s+");
        List<DocumentChunk> chunks = new ArrayList<>();
        int chunkSize = 350;
        int overlap = 50;
        int start = 0;
        int chunkIdx = 0;

        while (start < words.length) {
            int end = Math.min(start + chunkSize, words.length);
            StringBuilder sb = new StringBuilder();
            for (int i = start; i < end; i++) {
                sb.append(words[i]).append(" ");
            }
            String chunkContent = sb.toString().trim();

            // Generate dense embeddings using local model (e.g. nomic-embed-text or llama3)
            float[] embedding = ollamaService.generateEmbedding("nomic-embed-text", chunkContent);

            DocumentChunk chunk = DocumentChunk.builder()
                .document(document)
                .chunkIndex(chunkIdx++)
                .pageNumber((start / 300) + 1)
                .content(chunkContent)
                .embedding(embedding)
                .build();

            chunks.add(chunk);
            if (end >= words.length) break;
            start += (chunkSize - overlap);
        }

        return chunkRepository.saveAll(chunks);
    }
}
`,
  },
  {
    path: 'src/main/java/com/localmind/repository/DocumentChunkRepository.java',
    category: 'Repository',
    language: 'java',
    description: 'Spring Data JPA repository with native pgvector cosine distance similarity search',
    content: `package com.localmind.repository;

import com.localmind.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    @Query(value = """
        SELECT c.*, 1 - (c.embedding <=> cast(:queryVector as vector)) as similarity
        FROM document_chunks c
        WHERE c.document_id IN (:documentIds)
        ORDER BY c.embedding <=> cast(:queryVector as vector) ASC
        LIMIT :topK
        """, nativeQuery = true)
    List<DocumentChunk> findTopSimilarChunks(
        @Param("queryVector") String queryVector,
        @Param("documentIds") List<UUID> documentIds,
        @Param("topK") int topK
    );
}
`,
  },
  {
    path: 'src/main/java/com/localmind/controller/ChatController.java',
    category: 'Controller',
    language: 'java',
    description: 'REST Controller providing Server-Sent Events (SSE) streaming for real-time tokens',
    content: `package com.localmind.controller;

import com.localmind.service.OllamaService;
import com.localmind.service.RagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final OllamaService ollamaService;
    private final RagService ragService;

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout

        // Ground prompt with RAG context if document IDs are provided
        String prompt = request.getPrompt();
        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            prompt = ragService.augmentWithRagContext(prompt, request.getDocumentIds());
        }

        List<Map<String, String>> messages = List.of(
            Map.of("role", "system", "content", request.getSystemPrompt() != null ? request.getSystemPrompt() : "You are LocalMind."),
            Map.of("role", "user", "content", prompt)
        );

        ollamaService.streamChat(request.getModel(), messages, request.getTemperature())
            .subscribe(
                token -> {
                    try {
                        emitter.send(SseEmitter.event().data(Map.of("token", token)));
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                },
                emitter::completeWithError,
                emitter::complete
            );

        return emitter;
    }
}
`,
  },
  {
    path: 'docker-compose.yml',
    category: 'Docker',
    language: 'yaml',
    description: 'Production Docker Compose stack orchestrating Spring Boot, PostgreSQL with pgvector, and Ollama',
    content: `version: '3.8'

services:
  # 1. PostgreSQL 16 with pgvector extension pre-installed
  db:
    image: pgvector/pgvector:pg16
    container_name: localmind-postgres
    restart: always
    environment:
      POSTGRES_DB: localmind_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d localmind_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. LocalMind Java 21 Spring Boot Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: localmind-backend
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/localmind_db
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgrespassword
      OLLAMA_BASE_URL: http://ollama:11434
    ports:
      - "8080:8080"

  # 3. LocalMind React / Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: localmind-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080

  # 4. Ollama Service (can leverage NVIDIA GPU if configured)
  ollama:
    image: ollama/ollama:latest
    container_name: localmind-ollama
    restart: always
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    # GPU Acceleration (Uncomment if NVIDIA GPU is present):
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]

volumes:
  postgres_data:
  ollama_models:
`,
  },
  {
    path: 'backend/Dockerfile',
    category: 'Docker',
    language: 'dockerfile',
    description: 'Multi-stage Dockerfile compiling Java 21 with Gradle/Maven and distroless runtime',
    content: `# Build Stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build fat jar
RUN ./mvnw clean package -DskipTests || mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /app/target/localmind-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
`,
  },
];
