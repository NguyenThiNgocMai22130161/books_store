-- =====================================================
-- Books Store AI - Database Setup Script
-- =====================================================
-- This script sets up the necessary database tables
-- and extensions for the AI chatbot service
-- =====================================================

-- Install pgvector extension (required for vector similarity search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- =====================================================
-- TABLE: book_vectors
-- Stores vector embeddings of books for semantic search
-- =====================================================

CREATE TABLE IF NOT EXISTS book_vectors (
    id              SERIAL PRIMARY KEY,
    
    -- Foreign key to books table
    book_id         BIGINT NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
    
    -- Preprocessed text used for embedding
    -- Format: title + author + description + category + reviews
    search_text     TEXT NOT NULL,
    
    -- Vector embedding (768 dimensions for Google text-embedding-004)
    embedding       vector(768) NOT NULL,
    
    -- Metadata for hybrid scoring
    avg_rating      DECIMAL(3,2) DEFAULT 0.0,
    total_reviews   INTEGER DEFAULT 0,
    total_orders    INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES for book_vectors
-- =====================================================

-- Vector similarity search using HNSW (Hierarchical Navigable Small World)
-- This is much faster than brute-force for large datasets
CREATE INDEX IF NOT EXISTS idx_book_vectors_embedding 
ON book_vectors USING hnsw (embedding vector_cosine_ops);

-- Regular index for book_id lookups
CREATE INDEX IF NOT EXISTS idx_book_vectors_book_id 
ON book_vectors(book_id);

-- Index for metadata filters
CREATE INDEX IF NOT EXISTS idx_book_vectors_rating 
ON book_vectors(avg_rating);

-- =====================================================
-- TABLE: chat_history (Optional - for future)
-- Stores conversation history for context
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_history (
    id              SERIAL PRIMARY KEY,
    
    -- User reference (can be NULL for anonymous chats)
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session identifier for grouping messages
    session_id      VARCHAR(255) NOT NULL,
    
    -- Message role: 'user' or 'assistant'
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    
    -- Message content
    message         TEXT NOT NULL,
    
    -- Metadata
    book_ids        BIGINT[],  -- Books referenced in this message
    intent          VARCHAR(50),  -- search, recommendation, comparison, etc.
    
    -- Timestamp
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Index for retrieving chat history
CREATE INDEX IF NOT EXISTS idx_chat_history_session 
ON chat_history(user_id, session_id, created_at);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('book_vectors', 'chat_history');

-- Check book_vectors structure
\d book_vectors

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'book_vectors';

-- =====================================================
-- TEST QUERIES (Run after data ingestion)
-- =====================================================

/*
-- Count vectors
SELECT COUNT(*) as total_books FROM book_vectors;

-- Sample data
SELECT 
    book_id, 
    LEFT(search_text, 100) as preview,
    avg_rating,
    total_reviews
FROM book_vectors 
LIMIT 5;

-- Test vector similarity search (requires actual data)
SELECT 
    book_id,
    search_text,
    1 - (embedding <=> '[...]'::vector) as similarity
FROM book_vectors
ORDER BY embedding <=> '[...]'::vector
LIMIT 5;
*/

-- =====================================================
-- CLEANUP (Use with caution - drops all data!)
-- =====================================================

/*
-- Uncomment to drop tables if you need to reset
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS book_vectors CASCADE;
DROP EXTENSION IF EXISTS vector CASCADE;
*/
