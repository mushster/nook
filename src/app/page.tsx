"use client";

import React from 'react';
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/results?q=${encodeURIComponent(query)}`);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-[var(--background)]">   
      <h1 className="text-4xl font-bold mb-8">
        Find your <span 
          className="inline-block relative bg-gradient-to-r from-[#e07a5f] via-[#81b29a] to-[#f2cc8f] text-transparent bg-clip-text"
          style={{
            animation: 'none',
            transform: `translateY(${Math.sin(Date.now() / 1000) * 10}px) rotate(${Math.sin(Date.now() / 1200) * 2}deg)`
          }}
          ref={el => {
            if (el) {
              const animate = () => {
                const y = Math.sin(Date.now() / 1000) * 10;
                const rotate = Math.sin(Date.now() / 1200) * 2;
                el.style.transform = `translateY(${y}px) rotate(${rotate}deg)`;
                requestAnimationFrame(animate);
              };
              requestAnimationFrame(animate);
            }
          }}
        >Nook</span>
      </h1>
      <div className="flex-grow"></div>
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div 
          className={`w-full relative transition-all duration-300 ${
            isFocused ? "scale-105" : "scale-100"
          }`}
        >
          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className={`
              relative flex items-center w-full h-16 rounded-md 
              neo-brutalism
              ${isFocused ? "translate-y-[-4px] translate-x-[-4px] shadow-[8px_8px_0_var(--foreground)]" : ""}
              transition-all duration-300
            `}>
              <IoSearchOutline className="absolute left-5 text-[var(--foreground)] text-2xl" />
              <input
                type="text"
                placeholder=""
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="
                  w-full h-full pl-14 pr-6 rounded-md
                  bg-transparent
                  text-[var(--foreground)]
                  font-medium placeholder:text-[var(--foreground)]/50
                  focus:outline-none
                "
              />
            </div>
          </form>
        </div>

        {/* Search Tips */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {[
            { title: "Find New Favorites", description: "Enter a location to find similar spots worldwide", color: "var(--primary)" },
            { title: "Be Specific", description: "Try 'cafes in Paris similar to Blue Bottle'", color: "var(--secondary)" },
            { title: "Compare Cities", description: "Search 'neighborhoods in Berlin like Brooklyn'", color: "var(--accent)" }
          ].map((tip, i) => (
            <div key={i} className="
              p-4 rounded-md
              neo-brutalism
              hover:translate-y-[-2px] hover:translate-x-[-2px]
              hover:shadow-[6px_6px_0_var(--foreground)]
              transition-all
            " style={{backgroundColor: tip.color, color: tip.color === "var(--accent)" ? "var(--foreground)" : "white"}}>
              <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
              <p className="text-sm opacity-90">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-grow"></div>
    </div>
  );
}
