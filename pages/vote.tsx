import React, { useEffect, useState, useCallback } from 'react';
import { ref, runTransaction, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronUp, MessageCircle, ExternalLink, Info } from 'lucide-react';

// YouTube API response interfaces
interface YouTubeCommentSnippet {
  authorDisplayName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  publishedAt: string;
  likeCount: number;
}

interface YouTubeComment {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: YouTubeCommentSnippet;
    };
  };
}

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  publishedAt: string;
}

interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount: string;
}

interface YouTubeVideo {
  id: string;
  snippet: YouTubeVideoSnippet;
  statistics: YouTubeVideoStatistics;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  publishedAt: Date;
  authorProfileImg: string;
  likeCount: number;
}

interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
}

interface VoteCount {
  votes1: number;
  votes2: number;
}

const useVoteCount = (): VoteCount => {
  const [votes, setVotes] = useState<VoteCount>({ votes1: 0, votes2: 0 });
  
  useEffect(() => {
    const votesRef = ref(db, 'matches/match1');
    
    const unsubscribe = onValue(votesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVotes({
          votes1: data.votes1 || 0,
          votes2: data.votes2 || 0
        });
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return votes;
};

const VotingPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [expandedComments, setExpandedComments] = useState(false);
  const [showVideoDetails, setShowVideoDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const votes = useVoteCount();

  const handleVote = async (pieceIndex: number): Promise<void> => {
    if (hasVoted) return;
    
    const voteRef = ref(db, 'matches/match1');
    
    try {
      await runTransaction(voteRef, (currentData) => {
        if (!currentData) {
          return {
            votes1: pieceIndex === 0 ? 1 : 0,
            votes2: pieceIndex === 1 ? 1 : 0,
            active: true
          };
        }
        
        return {
          ...currentData,
          votes1: pieceIndex === 0 ? (currentData.votes1 || 0) + 1 : (currentData.votes1 || 0),
          votes2: pieceIndex === 1 ? (currentData.votes2 || 0) + 1 : (currentData.votes2 || 0),
        };
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasVoted', 'true');
        localStorage.setItem('votedFor', String(pieceIndex));
      }
      setHasVoted(true);
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasVoted(!!localStorage.getItem('hasVoted'));
    }
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      if (!videos[currentVideoIndex]?.id) return;
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?` +
        `part=snippet&videoId=${videos[currentVideoIndex].id}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&maxResults=20`
      );
      
      const data = await response.json();
      
      if (data.items) {
        setComments(data.items.map((item: YouTubeComment) => ({
          id: item.id,
          author: item.snippet.topLevelComment.snippet.authorDisplayName,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          publishedAt: new Date(item.snippet.topLevelComment.snippet.publishedAt),
          authorProfileImg: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
        })));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }, [videos, currentVideoIndex]);

  useEffect(() => {
    const loadVideos = async () => {
      const videoIds = ['mSeGecrtEqM', '59Dm0YYiBEk'];
      
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?` +
          `part=snippet,statistics&id=${videoIds.join(',')}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.items) {
          setVideos(data.items.map((item: YouTubeVideo) => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
            viewCount: parseInt(item.statistics.viewCount).toLocaleString(),
            likeCount: parseInt(item.statistics.likeCount).toLocaleString(),
          })));
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      }
    };

    loadVideos();
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      loadComments();
    }
  }, [videos, loadComments]);

  const switchVideo = () => {
    setCurrentVideoIndex(prev => prev === 0 ? 1 : 0);
    setShowVideoDetails(false);
  };

  const renderVoteResults = () => {
    const totalVotes = votes.votes1 + votes.votes2;
    const getPercentage = (voteCount: number) => 
      totalVotes === 0 ? 0 : ((voteCount / totalVotes) * 100).toFixed(1);

    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
        <h3 className="text-xl font-bold mb-4">Current Results</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Piece 1</span>
              <span>{votes.votes1} votes ({getPercentage(votes.votes1)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-blue-500 rounded-full h-4 transition-all duration-500"
                style={{ width: `${getPercentage(votes.votes1)}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Piece 2</span>
              <span>{votes.votes2} votes ({getPercentage(votes.votes2)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-purple-500 rounded-full h-4 transition-all duration-500"
                style={{ width: `${getPercentage(votes.votes2)}%` }}
              />
            </div>
          </div>
          
          <p className="text-center text-gray-400 mt-4">
            Total Votes: {totalVotes}
          </p>
        </div>
      </div>
    );
  };

  const visibleComments = expandedComments ? comments : comments.slice(0, 5);

  if (videos.length < 2) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading videos...</p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="min-h-screen bg-[#1a1b26] text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#13141f] border-b border-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              TezTones Vote
            </h1>
            <Link 
              href="/" 
              className="bg-[#2a2d3d] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#363b54] transition-colors"
            >
              Watch Live
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 container mx-auto px-4 pb-8">
        {/* Video Player */}
        <div className="bg-[#1f2133] rounded-xl overflow-hidden shadow-xl mb-6">
          <div className="aspect-video relative">
            {currentVideo && (
              <iframe
                className="w-full h-full absolute inset-0"
                src={`https://www.youtube.com/embed/${currentVideo.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-gray-400 text-sm">Currently Viewing</p>
                <h2 className="text-xl font-bold">Piece {currentVideoIndex + 1}</h2>
              </div>
              <button
                onClick={switchVideo}
                className="bg-[#2a2d3d] text-white px-6 py-2 rounded-full hover:bg-[#363b54] transition-all transform hover:scale-105"
              >
                Switch to Piece {currentVideoIndex === 0 ? '2' : '1'}
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-[#1f2133] rounded-xl p-6 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length} Comments</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${currentVideo?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Go to YouTube to Comment
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {visibleComments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <div className="relative w-10 h-10">
                  <Image
                    src={comment.authorProfileImg || '/api/placeholder/40/40'}
                    alt={comment.author}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-sm text-gray-400">
                      {comment.publishedAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voting Section */}
        <div className="bg-[#1f2133] rounded-xl p-6 shadow-xl">
          <h3 className="text-2xl font-bold mb-6">Cast Your Vote</h3>
          {renderVoteResults()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((index) => (
              <button
                key={index}
                onClick={() => handleVote(index)}
                disabled={hasVoted}
                className={`p-6 rounded-xl text-lg font-bold transition-all transform hover:scale-105 ${
                  hasVoted
                    ? localStorage.getItem('votedFor') === String(index)
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-[#2a2d3d] opacity-50'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                }`}
              >
                {hasVoted
                  ? localStorage.getItem('votedFor') === String(index)
                    ? `🏆 You voted for Piece ${index + 1}!`
                    : `Piece ${index + 1}`
                  : `Vote for Piece ${index + 1}`}
              </button>
            ))}
          </div>
          {hasVoted && (
            <div className="mt-6 text-center text-gray-400">
              Thanks for voting! Your support helps determine the winner.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VotingPage;