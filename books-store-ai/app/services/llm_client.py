"""
LLM Client
Google Gemini chat integration
"""

import google.generativeai as genai
from typing import List, Dict
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Wrapper for Google Gemini chat API
    """
    
    def __init__(self):
        """Initialize LLM client"""
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # Initialize model
        self.model = genai.GenerativeModel(
            model_name=settings.LLM_MODEL,
            generation_config={
                'temperature': settings.TEMPERATURE,
                'top_p': 0.95,
                'top_k': 40,
                'max_output_tokens': 2048,
            }
        )
        
        logger.info(f"[OK] LLM client initialized: {settings.LLM_MODEL}")
    
    def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Send chat messages and get response
        
        Args:
            messages: List of message dicts with 'role' and 'content'
                     [{'role': 'user', 'content': '...'}]
        
        Returns:
            Response text
        """
        try:
            # Convert messages to Gemini format
            chat = self.model.start_chat(history=[])
            
            # Get last user message
            last_message = messages[-1]['content'] if messages else ""
            
            # Generate response
            response = chat.send_message(last_message)
            
            return response.text
            
        except Exception as e:
            logger.error(f"[OK] LLM error: {str(e)}")
            return "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại."
    
    def generate(self, prompt: str) -> str:
        """
        Generate response from a single prompt
        
        Args:
            prompt: Complete prompt text
            
        Returns:
            Generated text
        """
        try:
            logger.info("[OK] Calling Gemini API...")
            response = self.model.generate_content(prompt)
            logger.info(f"[OK] Gemini response received: {len(response.text)} chars")
            return response.text
        
        except Exception as e:
            logger.error(f"[OK] Generation error: {type(e).__name__}: {str(e)}")
            logger.exception("Full traceback:")
            return "Xin lỗi, tôi không thể trả lời câu hỏi này."


# Global LLM client instance
llm_client = LLMClient()
