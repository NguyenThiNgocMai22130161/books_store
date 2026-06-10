-- Chat History Table for storing conversation history
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id BIGINT,
    book_id BIGINT REFERENCES books(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    intent VARCHAR(50),
    sources JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    favorite_categories JSONB DEFAULT '[]'::jsonb,
    reading_interests TEXT[],
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    preferred_authors TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Review Vectors Table for review analysis
CREATE TABLE IF NOT EXISTS review_vectors (
    id SERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    embedding vector(3072),
    sentiment VARCHAR(20),
    sentiment_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id)
);

CREATE INDEX idx_review_vectors_book_id ON review_vectors(book_id);
CREATE INDEX idx_review_vectors_sentiment ON review_vectors(sentiment);

COMMENT ON TABLE chat_history IS 'Stores AI chatbot conversation history';
COMMENT ON TABLE user_preferences IS 'Stores user preferences for personalized recommendations';
COMMENT ON TABLE review_vectors IS 'Stores review embeddings for sentiment analysis';
