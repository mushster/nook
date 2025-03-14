import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define result interface
interface SearchResult {
  title: string;
  description: string;
  locationDetails?: string;
  similarity?: string;
  category: string;
  url?: string;
}

// Initialize OpenAI client with error handling for missing API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Simple in-memory cache for search results
// For production, consider using Redis or another persistent cache
interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const CACHE_EXPIRY = 1000 * 60 * 60; // Cache for 1 hour
const searchCache = new Map<string, CacheEntry>();

// Simple rate limiting by IP address
const rateLimits = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT = 10; // Maximum requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

export async function POST(request: Request) {
  // Get IP address (implementation depends on hosting platform)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Check rate limit
  const now = Date.now();
  const rateData = rateLimits.get(ip) || { count: 0, resetTime: now + RATE_WINDOW };
  
  // Reset counter if window expired
  if (rateData.resetTime < now) {
    rateData.count = 0;
    rateData.resetTime = now + RATE_WINDOW;
  }
  
  // Check if rate limit exceeded
  if (rateData.count >= RATE_LIMIT) {
    return NextResponse.json({ 
      results: [],
      error: 'Rate limit exceeded. Please try again later.'
    }, { status: 429 });
  }
  
  // Increment counter
  rateData.count++;
  rateLimits.set(ip, rateData);
  
  try {
    const { query } = await request.json();
    
    if (!query || query.trim() === '') {
      return NextResponse.json({ results: [] }, { status: 400 });
    }

    // Check if we have a cached result for this query
    const cacheKey = query.trim().toLowerCase();
    const cachedEntry = searchCache.get(cacheKey);
    
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRY) {
      return NextResponse.json({ results: cachedEntry.results });
    }

    // Validate the API key is present
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return NextResponse.json({ 
        results: [],
        error: 'API configuration error' 
      }, { status: 500 });
    }

    // Define the system prompt that explains the assistant's job
    const systemPrompt = `You are a travel assistant that helps people find places that are similar to other places they know.
    Given a query asking for similar locations, you should return a JSON object with a "results" array containing exactly 7 similar places.
    
    Your response MUST be in this exact format:
    {
      "results": [
        {
          "title": "Name of the place",
          "description": "Brief description",
          "locationDetails": "Address or location info",
          "similarity": "Why it's similar",
          "category": "Type of place",
          "url": "Optional link"
        },
        ...more results...
      ]
    }
    
    It's important to provide exactly 7 results when possible.
    This exact format with a results array is required. Do not return any other format.`;

    // Make a request to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Extract the response text
    const responseText = completion.choices[0].message.content;
    
    try {
      // Parse the response as JSON
      const parsedResponse = JSON.parse(responseText || '{"results": []}');
      
      let results: SearchResult[] = [];
      
      // Fix structure mismatch by adapting the response format
      if (!parsedResponse.results) {
        // Look for any array property that might contain the results
        const arrayProps = Object.keys(parsedResponse).filter(key => 
          Array.isArray(parsedResponse[key])
        );
        
        if (arrayProps.length > 0) {
          // Found an array property, use it as results
          const propertyWithResults = arrayProps[0];
          results = parsedResponse[propertyWithResults];
        } else if (Array.isArray(parsedResponse)) {
          // The response itself is an array
          results = parsedResponse;
        } else {
          // No arrays found, return debug info
          results = [{
            title: "Response Format Issue",
            description: "The search service returned data in an unexpected format.",
            category: "Error",
            locationDetails: "Please try a different search query",
            similarity: "N/A"
          }];
        }
      } else {
        // If it already has results property, use it
        results = parsedResponse.results;
      }
      
      // Store in cache
      searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      
      return NextResponse.json({ results });
    } catch (parseError) {
      console.error("Failed to parse search results:", parseError);
      // Fallback response with error message
      return NextResponse.json({ 
        results: [],
        error: 'Failed to parse search results'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    // Enhanced error logging
    console.error("Search API error:", error);
    return NextResponse.json({ 
      results: [],
      error: 'Failed to process search request' 
    }, { status: 500 });
  }
} 