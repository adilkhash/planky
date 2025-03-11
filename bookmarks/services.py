import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re
from typing import Dict, Optional


def fetch_url_metadata(url: str) -> dict[str, Optional[str]]:
    """
    Fetch metadata from a URL including title and description.

    Args:
        url: The URL to fetch metadata from

    Returns:
        Dict containing title and description
    """
    try:
        # Add headers to mimic a browser request
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        }

        # Make the request with a timeout
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Parse the HTML content
        soup = BeautifulSoup(response.text, "html.parser")

        # Get title
        title = None
        if soup.title:
            title = soup.title.string.strip()
        elif soup.find("meta", property="og:title"):
            title = soup.find("meta", property="og:title")["content"]
        elif soup.find("meta", name="twitter:title"):
            title = soup.find("meta", name="twitter:title")["content"]

        # Get description
        description = None
        # Try meta description first
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            description = meta_desc["content"]
        # Try OpenGraph description
        elif soup.find("meta", property="og:description"):
            description = soup.find("meta", property="og:description")["content"]
        # Try Twitter description
        elif soup.find("meta", property="twitter:description"):
            description = soup.find("meta", property="twitter:description")["content"]
        # Fallback to first paragraph
        else:
            first_p = soup.find("p")
            if first_p:
                description = first_p.get_text().strip()
                # Limit description length
                if len(description) > 200:
                    description = description[:197] + "..."

        # Clean up description
        if description:
            description = re.sub(r"\s+", " ", description).strip()

        return {"title": title, "description": description, "url": url}

    except requests.RequestException as e:
        return {"title": None, "description": None, "url": url, "error": str(e)}
    except Exception as e:
        return {"title": None, "description": None, "url": url, "error": str(e)}
