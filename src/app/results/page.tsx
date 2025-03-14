"use client";
import React, { Suspense } from 'react';
import { useState, useEffect } from "react";
import { IoArrowBackOutline, IoSearchOutline } from "react-icons/io5";
import { IoCloseOutline } from "react-icons/io5";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// Result type for structured responses
interface SearchResult {
  title: string;
  description: string;
  locationDetails?: string;
  similarity?: string;
  category: string;
  url?: string;
}

// Create a separate component for the search functionality
function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(queryParam);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  
  useEffect(() => {
    // Trigger the search when the component loads with a query parameter
    if (queryParam) {
      searchOpenAI(queryParam);
    }
    
    // Set loaded state after a small delay to trigger animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [queryParam]);
  
  const searchOpenAI = async (searchQuery: string) => {
    // Clear previous results and reset state
    setIsSearching(true);
    setError(null);
    setShowUnsupportedModal(false);
    
    try {
      // Call to your backend API endpoint that will handle the OpenAI request
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we have valid results
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
        // Show unsupported modal if we got empty results
        if (data.results.length === 0) {
          setShowUnsupportedModal(true);
        }
      } else {
        // Handle unexpected data format
        setError('Received invalid data format from server');
        setResults([]);
      }
    } catch (error: unknown) {
      setError(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/results?q=${encodeURIComponent(query)}`);
      searchOpenAI(query);
    }
  };
  
  const handleBackToHome = () => {
    router.push("/");
  };

  const closeModal = () => {
    setShowUnsupportedModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]" key={`results-${results.length}-${isSearching}`}>
      {/* Header with Search Bar */}
      <motion.div 
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-10 py-4 bg-[var(--background)]"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="relative">
            <button 
              onClick={handleBackToHome}
              className="fixed left-4 top-4 font-bold text-xl md:text-2xl hover:text-[var(--primary)] transition-colors"
            >
              <IoArrowBackOutline className="text-xl" />
            </button>
            
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="flex-1">
                <div className={`
                  relative flex items-center w-full h-12 rounded-md 
                  neo-brutalism
                  ${isFocused ? "translate-y-[-2px] translate-x-[-2px] shadow-[6px_6px_0_var(--foreground)]" : ""}
                  transition-all duration-300
                `}>
                  <IoSearchOutline className="absolute left-4 text-[var(--foreground)] text-lg" />
                  <input
                    type="text"
                    placeholder="Search for similar places (e.g., places in Tokyo similar to Williamsburg)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="
                      w-full h-full pl-12 pr-4
                      bg-transparent
                      text-[var(--foreground)]
                      font-medium placeholder:text-gray-500
                      focus:outline-none
                    "
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Count or Loading State */}
      <div className="max-w-5xl mx-auto mt-8">
        {isSearching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-8"
          >
            <div className="animate-bounce h-12 w-12 rounded-md bg-[var(--accent)] border-[3px] border-[var(--foreground)] shadow-[3px_3px_0_var(--foreground)]"></div>
            <span className="ml-3 text-[var(--foreground)] font-bold">Searching for similar places...</span>
          </motion.div>
        ) : (
          <>
            {error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                className="text-[var(--primary)] bg-[var(--primary)]/10 neo-brutalism p-4 mb-6"
              >
                {error}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-sm text-[var(--foreground)]/70 mb-4"
              >
              </motion.div>
            )}
            
            {/* Search Results */}
            <div className="space-y-8">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: isLoaded ? 0 : 20, opacity: isLoaded ? 1 : 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.3 + (index * 0.1),
                    ease: "easeOut"
                  }}
                  className="group"
                >
                  <div
                    className="block p-6 rounded-md
                      neo-brutalism
                      bg-white dark:bg-[#1e1e1e]
                      group-hover:translate-y-[-4px] group-hover:translate-x-[-4px]
                      group-hover:shadow-[8px_8px_0_var(--foreground)]
                      transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-bold group-hover:text-[var(--primary)] transition-colors">
                          {result.title}
                        </h2>
                        <p className="mt-3 text-[var(--foreground)] dark:text-[var(--foreground)]/90">
                          {result.description}
                        </p>
                        {result.locationDetails && (
                          <p className="mt-3 text-sm text-[var(--foreground)]/70 dark:text-[var(--foreground)]/60 font-medium">
                            {result.locationDetails}
                          </p>
                        )}
                        {result.similarity && (
                          <p className="mt-2 text-sm text-[var(--secondary)] dark:text-[var(--secondary)] font-bold">
                            {result.similarity}
                          </p>
                        )}
                        {result.url && (
                          <a 
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="mt-4 inline-block text-sm bg-[var(--primary)] text-white px-4 py-2 rounded-md 
                              border-[3px] border-[var(--foreground)]
                              shadow-[3px_3px_0_var(--foreground)]
                              hover:translate-y-[-2px] hover:translate-x-[-2px]
                              hover:shadow-[5px_5px_0_var(--foreground)]
                              active:translate-y-[0px] active:translate-x-[0px]
                              active:shadow-[3px_3px_0_var(--foreground)]
                              transition-all duration-300 font-bold"
                          >
                            Learn more →
                          </a>
                        )}
                      </div>
                      <span className="px-3 py-1 text-xs rounded-md 
                        bg-[var(--accent)] text-[var(--foreground)]
                        border-[3px] border-[var(--foreground)]
                        shadow-[2px_2px_0_var(--foreground)]
                        font-bold"
                      >
                        {result.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Unsupported Query Modal */}
        {showUnsupportedModal && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div className="relative bg-white dark:bg-[#1e1e1e] rounded-md neo-brutalism p-6 max-w-md w-full">
              <button 
                onClick={closeModal}
                className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center 
                  bg-[var(--primary)] text-white rounded-md
                  border-[3px] border-[var(--foreground)]
                  shadow-[2px_2px_0_var(--foreground)]
                  hover:translate-y-[-2px] hover:translate-x-[-2px]
                  hover:shadow-[4px_4px_0_var(--foreground)]
                  transition-all duration-300"
              >
                <IoCloseOutline className="text-xl" />
              </button>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 
                  rounded-md bg-[var(--accent)] border-[3px] border-[var(--foreground)]
                  shadow-[3px_3px_0_var(--foreground)] mb-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Unsupported Query</h3>
                <p className="text-sm text-[var(--foreground)]/80 mb-4">
                  Your search query could not be processed. Please try a more specific query about finding similar places.
                </p>
                <p className="text-xs text-[var(--foreground)]/70 mb-6">
                  Example: &quot;Places in Tokyo similar to Williamsburg&quot; or &quot;Cafes in Paris similar to Blue Bottle&quot;
                </p>
                <button
                  onClick={closeModal}
                  className="w-full py-3 px-4 rounded-md 
                    bg-[var(--primary)] text-white font-bold
                    border-[3px] border-[var(--foreground)]
                    shadow-[3px_3px_0_var(--foreground)]
                    hover:translate-y-[-2px] hover:translate-x-[-2px]
                    hover:shadow-[5px_5px_0_var(--foreground)]
                    active:translate-y-[0px] active:translate-x-[0px]
                    active:shadow-[3px_3px_0_var(--foreground)]
                    transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function Results() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="animate-bounce h-12 w-12 rounded-md bg-[var(--accent)] border-[3px] border-[var(--foreground)] shadow-[3px_3px_0_var(--foreground)]"></div>
    </div>}>
      <SearchResults />
    </Suspense>
  );
} 