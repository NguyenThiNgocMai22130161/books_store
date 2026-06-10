#!/usr/bin/env python3
"""
List all available Gemini models
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=api_key)

print("🔍 LISTING ALL AVAILABLE MODELS\n")
print("=" * 60)

try:
    models = genai.list_models()
    
    llm_models = []
    embedding_models = []
    
    for model in models:
        name = model.name
        supported = ", ".join(model.supported_generation_methods)
        
        if 'generateContent' in supported:
            llm_models.append(name)
        if 'embedContent' in supported:
            embedding_models.append(name)
    
    print("\n📝 LLM MODELS (for chat/generation):")
    print("-" * 60)
    for model in llm_models:
        print(f"  ✅ {model}")
    
    print("\n🔢 EMBEDDING MODELS:")
    print("-" * 60)
    for model in embedding_models:
        print(f"  ✅ {model}")
    
    print("\n" + "=" * 60)
    print(f"\nTotal: {len(llm_models)} LLM models, {len(embedding_models)} embedding models")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")
