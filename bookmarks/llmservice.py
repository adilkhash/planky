import json
import time
import logging
import openai
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("llm_service.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("LLMService")


class LLMService:
    """Service for interacting with LLMs for auto-tagging."""
    
    def __init__(
        self, 
        api_key: str = None,
        model: str = "gpt-3.5-turbo",
        max_retries: int = 3,
        rate_limit_requests: int = 10,
        rate_limit_period: int = 60,
        temperature: float = 0.2,
        **kwargs
    ):
        """
        Initialize the LLM service.
        
        Args:
            api_key: OpenAI API key. If None, will look for OPENAI_API_KEY env var
            model: The model to use for completions
            max_retries: Maximum number of retry attempts for API calls
            rate_limit_requests: Maximum requests allowed in the rate limit period
            rate_limit_period: The rate limit period in seconds
            temperature: Temperature for text generation (lower for more deterministic results)
            **kwargs: Additional parameters to pass to the OpenAI client
        """
        # Secure API key handling
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("API key must be provided or set as OPENAI_API_KEY environment variable")
        
        # Initialize client
        self.client = openai.OpenAI(api_key=self.api_key)
        
        # Store configuration
        self.model = model
        self.max_retries = max_retries
        self.temperature = temperature
        self.additional_params = kwargs
        
        # Rate limiting setup
        self.rate_limit_requests = rate_limit_requests
        self.rate_limit_period = rate_limit_period
        self.request_timestamps = []
        
        logger.info(f"LLM Service initialized with model: {model}")
    
    def _enforce_rate_limit(self):
        """
        Enforce rate limiting to prevent API overuse.
        Blocks execution if rate limit would be exceeded.
        """
        current_time = time.time()
        
        # Remove timestamps older than the rate limit period
        self.request_timestamps = [ts for ts in self.request_timestamps 
                                  if current_time - ts < self.rate_limit_period]
        
        # Check if we've reached the rate limit
        if len(self.request_timestamps) >= self.rate_limit_requests:
            # Calculate sleep time
            oldest_timestamp = min(self.request_timestamps)
            sleep_time = self.rate_limit_period - (current_time - oldest_timestamp)
            
            if sleep_time > 0:
                logger.warning(f"Rate limit reached. Sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
        
        # Add current timestamp
        self.request_timestamps.append(time.time())
    
    def _prepare_tag_generation_prompt(self, content: str, max_tags: int = 5, tag_format: str = "comma") -> tuple:
        """
        Prepare a prompt to generate tags for the given content.
        
        Args:
            content: The content to generate tags for
            max_tags: Maximum number of tags to generate
            tag_format: Format of the output tags ('comma', 'json', 'list')
            
        Returns:
            Tuple of (system_message, user_message)
        """
        # Create a system message to define the task clearly
        system_message = (
            "You are a precise tagging system. Extract relevant tags from the provided content "
            "that accurately represent the key topics, themes, and entities. "
            f"Return only {max_tags} most relevant tags without explanation."
        )
        
        # Add formatting instructions based on tag_format
        format_instructions = ""
        if tag_format == "comma":
            format_instructions = "Return tags as a comma-separated list."
        elif tag_format == "json":
            format_instructions = "Return tags as a JSON array of strings."
        elif tag_format == "list":
            format_instructions = "Return tags one per line with no other text."
        
        # Build the user prompt with the content to analyze
        user_prompt = (
            f"Generate up to {max_tags} relevant tags for the following content:\n\n"
            f"{content}\n\n"
            f"{format_instructions}"
        )
        
        return system_message, user_prompt
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError)),
        reraise=True
    )
    def _call_llm_api(self, system_message: str, user_message: str) -> dict:
        """
        Call the LLM API with retry logic.
        
        Args:
            system_message: The system message defining the LLM's behavior
            user_message: The user message containing the content and instructions
            
        Returns:
            LLM API response
        """
        # Log the API call
        logger.info(f"Calling LLM API with model: {self.model}")
        
        # Enforce rate limiting
        self._enforce_rate_limit()
        
        try:
            # Make the API call
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                temperature=self.temperature,
                **self.additional_params
            )
            
            # Log successful response
            logger.info("LLM API call successful")
            return response
            
        except (openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError) as e:
            # These errors will be caught by the retry decorator
            logger.warning(f"Retryable error occurred: {str(e)}")
            raise
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Error calling LLM API: {str(e)}")
            raise
    
    def _extract_tags_from_response(self, response: dict, tag_format: str = "comma") -> list[str]:
        """
        Extract tags from the LLM response.
        
        Args:
            response: The LLM API response
            tag_format: Format of the output tags ('comma', 'json', 'list')
            
        Returns:
            List of extracted tags
        """
        try:
            # Extract the text content from the response
            content = response.choices[0].message.content.strip()
            
            # Parse based on format
            if tag_format == "comma":
                # Handle comma-separated format
                tags = [tag.strip() for tag in content.split(',')]
            elif tag_format == "json":
                # Handle JSON format (attempt to parse, fallback to comma-separated)
                try:
                    if content.startswith("[") and content.endswith("]"):
                        tags = json.loads(content)
                    else:
                        # Try to find a JSON array in the response
                        import re
                        json_match = re.search(r'\[(.*)\]', content)
                        if json_match:
                            json_str = json_match.group(0)
                            tags = json.loads(json_str)
                        else:
                            # Fallback to comma-separated
                            tags = [tag.strip() for tag in content.split(',')]
                except json.JSONDecodeError:
                    # Fallback to comma-separated if JSON parsing fails
                    logger.warning("Failed to parse JSON tags, falling back to comma-separated")
                    tags = [tag.strip() for tag in content.split(',')]
            elif tag_format == "list":
                # Handle list format (one tag per line)
                tags = [line.strip() for line in content.split('\n') if line.strip()]
            else:
                # Default fallback
                tags = [tag.strip() for tag in content.split(',')]
            
            # Filter out empty tags and duplicates
            tags = [tag for tag in tags if tag]
            tags = list(dict.fromkeys(tags))  # Remove duplicates while preserving order
            
            logger.info(f"Successfully extracted {len(tags)} tags")
            return tags
            
        except Exception as e:
            logger.error(f"Error extracting tags: {str(e)}")
            return []
    
    def generate_tags(
        self,
        content: str,
        max_tags: int = 5,
        tag_format: str = "comma",
        fallback_tags: list[str] = None
    ) -> list[str]:
        """
        Generate tags for the given content.
        
        Args:
            content: The content to generate tags for
            max_tags: Maximum number of tags to generate
            tag_format: Format of the output tags ('comma', 'json', 'list')
            fallback_tags: Tags to use if tag generation fails
            
        Returns:
            List of generated tags
        """
        logger.info(f"Generating tags for content of length {len(content)}")
        
        try:
            # Prepare the prompt
            system_message, user_message = self._prepare_tag_generation_prompt(
                content=content,
                max_tags=max_tags,
                tag_format=tag_format
            )
            
            # Call the LLM API
            response = self._call_llm_api(system_message, user_message)
            
            # Extract tags from the response
            tags = self._extract_tags_from_response(response, tag_format)
            
            # Validate tags were extracted
            if not tags and fallback_tags:
                logger.warning("No tags extracted, using fallback tags")
                return fallback_tags
                
            return tags
            
        except Exception as e:
            logger.error(f"Failed to generate tags: {str(e)}")
            # Use fallback tags if provided
            if fallback_tags:
                logger.info("Using fallback tags due to error")
                return fallback_tags
            return []

    def batch_generate_tags(
        self,
        content_list: list[str],
        max_tags_per_item: int = 5,
        tag_format: str = "comma",
        fallback_tags: list[str] = None
    ) -> list[list[str]]:
        """
        Generate tags for multiple content items.
        
        Args:
            content_list: List of content items to generate tags for
            max_tags_per_item: Maximum number of tags to generate per item
            tag_format: Format of the output tags ('comma', 'json', 'list')
            fallback_tags: Tags to use if tag generation fails for an item
            
        Returns:
            List of tag lists, one for each content item
        """
        logger.info(f"Batch generating tags for {len(content_list)} items")
        
        results = []
        for i, content in enumerate(content_list):
            try:
                logger.info(f"Processing item {i+1}/{len(content_list)}")
                tags = self.generate_tags(
                    content=content,
                    max_tags=max_tags_per_item,
                    tag_format=tag_format,
                    fallback_tags=fallback_tags
                )
                results.append(tags)
            except Exception as e:
                logger.error(f"Error processing item {i+1}: {str(e)}")
                results.append(fallback_tags if fallback_tags else [])
        
        return results
