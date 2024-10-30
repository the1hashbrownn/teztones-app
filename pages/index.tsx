import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const LiveStreamPage = () => {
  const [liveStream, setLiveStream] = useState(null);
  const CHANNEL_ID = 'UCeLZvLUb0tXMK3hXBbM01ag';
  const API_KEY = 'AIzaSyBihpLsF0FrAsCXdB_Ryb2ba0_JQuNfgnU';

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&channelId=${CHANNEL_ID}&type=video&eventType=live&key=${API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const stream = data.items[0];
          setLiveStream({
            id: stream.id.videoId,
            title: stream.snippet.title,
          });
        }
      } catch (error) {
        console.error('Error checking live status:', error);
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
      <nav className="bg-black border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            TezTones Live
          </h1>
          <Link 
            href="/vote" 
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Vote Now
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4">
        {/* Live Stream Container */}
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl mb-6">
          {liveStream ? (
            <div>
              <div className="aspect-video relative">
                <iframe
                  className="w-full h-full absolute inset-0"
                  src={`https://www.youtube.com/embed/${liveStream.id}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">LIVE</span>
                  <span className="text-gray-400">Now Playing</span>
                </div>
                <h2 className="text-xl font-bold">{liveStream.title}</h2>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 mb-4">
                <svg className="animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-400">No Live Stream Currently</p>
              <p className="text-gray-500 mt-2">Check back later for the next live match</p>
            </div>
          )}
        </div>

        {/* Additional Content Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-3">About TezTones</h3>
            <p className="text-gray-400">
              Watch live art battles between talented artists competing head-to-head in our unique sports league format.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-3">How to Vote</h3>
            <p className="text-gray-400">
              After each match, head to the voting page to support your favorite artist and help them advance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;