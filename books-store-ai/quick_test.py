#!/usr/bin/env python3
"""
Quick Test Script for AI Service
Run this in a NEW terminal tab while server is running
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("🏥 TEST 1: HEALTH CHECK")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_chat():
    """Test chat endpoint"""
    print("\n" + "="*60)
    print("💬 TEST 2: CHAT")
    print("="*60)
    
    payload = {
        "message": "Gợi ý cho tôi 3 cuốn sách về kinh doanh hay nhất",
        "user_id": "test_user"
    }
    
    print(f"Request: {json.dumps(payload, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"\nStatus Code: {response.status_code}")
        result = response.json()
        
        print(f"\n📝 Answer:")
        print(result.get('answer', 'No answer'))
        
        if result.get('sources'):
            print(f"\n📚 Recommended Books ({len(result['sources'])} books):")
            for i, book in enumerate(result['sources'][:3], 1):
                print(f"  {i}. {book.get('title', 'N/A')}")
                print(f"     Price: ${book.get('price', 0):.2f} | Rating: {book.get('rating', 0):.1f}⭐")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_search():
    """Test semantic search"""
    print("\n" + "="*60)
    print("🔍 TEST 3: SEMANTIC SEARCH")
    print("="*60)
    
    payload = {
        "query": "sách về lập trình Python cho người mới",
        "limit": 5
    }
    
    print(f"Query: '{payload['query']}'")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/search",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"\nStatus Code: {response.status_code}")
        result = response.json()
        
        results = result.get('results', [])
        print(f"\n📚 Found {len(results)} books:")
        
        for i, book in enumerate(results[:5], 1):
            print(f"  {i}. {book.get('title', 'N/A')}")
            print(f"     Score: {book.get('score', 0):.3f} | Price: ${book.get('price', 0):.2f}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_similar():
    """Test similar books"""
    print("\n" + "="*60)
    print("🎯 TEST 4: SIMILAR BOOKS")
    print("="*60)
    
    # Using a sample book_id (you can change this)
    payload = {
        "book_id": 1,
        "top_k": 5
    }
    
    print(f"Request: {json.dumps(payload, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/similar",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"\nStatus Code: {response.status_code}")
        result = response.json()
        
        similar_books = result.get('similar_books', [])
        print(f"\n📚 Found {len(similar_books)} similar books to book #{payload['book_id']}:")
        
        for i, book in enumerate(similar_books[:5], 1):
            print(f"  {i}. {book.get('title', 'N/A')}")
            print(f"     Score: {book.get('score', 0):.3f} | Price: ${book.get('price', 0):.2f}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("\n" + "🚀"*30)
    print("   BOOKS STORE AI - QUICK TEST")
    print("🚀"*30)
    print(f"\nServer: {BASE_URL}")
    print("Make sure AI service is running in another terminal!")
    print("\nPress Ctrl+C to stop\n")
    
    try:
        # Run all tests
        results = []
        results.append(("Health Check", test_health()))
        results.append(("Chat", test_chat()))
        results.append(("Search", test_search()))
        results.append(("Similar Books", test_similar()))
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        for test_name, passed in results:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        total = len(results)
        passed = sum(1 for _, p in results if p)
        print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! AI service is working perfectly!")
        else:
            print("\n⚠️ Some tests failed. Check the errors above.")
            
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
