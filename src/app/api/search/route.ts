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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const CACHE_EXPIRY = 1000 * 60 * 60; // Cache for 1 hour
const searchCache = new Map<string, CacheEntry>();

const rateLimits = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

export async function POST(request: Request) {
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
          "category": "Can be multiple types separated by commas (e.g., 'Restaurant, Bar' or 'Park, Cultural Site')",
          "url": "Optional link"
        },
        ...more results...
      ]
    }

    When explaining similarities:
    - Use varied, natural language that avoids repetitive patterns
    - Draw from different aspects like atmosphere, demographics, history, architecture, culture, etc.
    - Be specific about what makes the connection unique
    - Mix both objective and subjective observations
    - Avoid starting every similarity with the same phrases
    - Consider both obvious and unexpected parallels
    
    Categories can include multiple types when appropriate (e.g., "Restaurant, Bar" or "Park, Cultural Site").
    
    It's important to provide exactly 7 results when possible. Do not respond if the query is not related to travel or finding similar places or seems to be a joke / not a real search.
    This exact format with a results array is required. Do not return any other format.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(responseText || '{"results": []}');
      
      let results: SearchResult[] = [];
      
      if (!parsedResponse.results) {
        const arrayProps = Object.keys(parsedResponse).filter(key => 
          Array.isArray(parsedResponse[key])
        );
        
        if (arrayProps.length > 0) {
          const propertyWithResults = arrayProps[0];
          results = parsedResponse[propertyWithResults];
        } else if (Array.isArray(parsedResponse)) {
          results = parsedResponse;
        } else {
          results = [{
            title: "Response Format Issue",
            description: "The search service returned data in an unexpected format.",
            category: "Error",
            locationDetails: "Please try a different search query",
            similarity: "N/A"
          }];
        }
      } else {
        results = parsedResponse.results;
      }
      
      searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      
      return NextResponse.json({ results });
    } catch (parseError) {
      console.error("Failed to parse search results:", parseError);
      return NextResponse.json({ 
        results: [],
        error: 'Failed to parse search results'
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Search API error:", error);
    return NextResponse.json({ 
      results: [],
      error: 'Failed to process search request' 
    }, { status: 500 });
  }
} 