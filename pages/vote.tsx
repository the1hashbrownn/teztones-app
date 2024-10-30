import React, { useEffect, useState } from 'react';
import { ref, runTransaction, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import Link from 'next/link';
import Image from 'next/image'; // Added for image optimization
import { ChevronDown, ChevronUp, MessageCircle, ExternalLink, Info } from 'lucide-react';

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
  const API_KEY = 'AIzaSyBihpLsF0FrAsCXdB_Ryb2ba0_JQuNfgnU';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasVoted(!!window.localStorage.getItem('hasVoted'));
    }
  }, []);

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
      
      localStorage.setItem('hasVoted', 'true');
      localStorage.setItem('votedFor', String(pieceIndex));
      setHasVoted(true);
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      if (!videos[currentVideoIndex]?.id) return;
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?` +
        `part=snippet&videoId=${videos[currentVideoIndex].id}&key=${API_KEY}&maxResults=20`
      );
      
      const data = await response.json();
      
      if (data.items) {
        setComments(data.items.map((item) => ({
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
  };

  useEffect(() => {
    const loadVideos = async () => {
      const videoIds = ['mSeGecrtEqM', '59Dm0YYiBEk'];
      
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?` +
          `part=snippet,statistics&id=${videoIds.join(',')}&key=${API_KEY}`
        );
        
        const data = await response.json();
        
        if (data.items) {
          setVideos(data.items.map((item) => ({
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
  }, [currentVideoIndex, videos]);

  const switchVideo = () => {
    setCurrentVideoIndex(prev => prev === 0 ? 1 : 0);
    setShowVideoDetails(false);
  };

  const renderVoteResults = () => {
    const totalVotes = votes.votes1 + votes.votes2;
    const getPercentage = (voteCount) => 
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
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-black border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            TezTones Vote
          </h1>
          <Link 
            href="/" 
            className="bg-gray-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-600 transition-colors"
          >
            Watch Live
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl mb-6">
          <div className="aspect-video relative">
            <iframe
              className="w-full h-full absolute inset-0"
              src={`https://www.youtube.com/embed/${currentVideo.id}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-gray-400">Currently Viewing</span>
                <h2 className="text-xl font-bold">Piece {currentVideoIndex + 1}</h2>
              </div>
              <button
                onClick={switchVideo}
                className="bg-gray-700 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                Switch to Piece {currentVideoIndex === 0 ? '2' : '1'}
              </button>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <button
                onClick={() => setShowVideoDetails(!showVideoDetails)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors w-full"
              >
                <Info size={20} />
                <span>Video Details</span>
                {showVideoDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {showVideoDetails && (
                <div className="mt-4 space-y-3 text-gray-300">
                  <div>
                    <h3 className="font-semibold text-white">{currentVideo.title}</h3>
                    <div className="flex gap-4 text-sm mt-2">
                      <span>{currentVideo.publishedAt}</span>
                      <span>👁️ {currentVideo.viewCount} views</span>
                      <span>👍 {currentVideo.likeCount} likes</span>
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-sm">{currentVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length} Comments</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Go to YouTube to Comment</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {visibleComments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <img
                    src={comment.authorProfileImg || '/api/placeholder/40/40'}
                    alt={comment.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{comment.author}</span>
                      <span className="text-sm text-gray-400">
                        {comment.publishedAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{comment.text}</p>
                  </div>
                </div>
              ))}

              {comments.length > 5 && (
                <button
                  onClick={() => setExpandedComments(!expandedComments)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {expandedComments ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      Show {comments.length - 5} More Comments
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-6">Cast Your Vote</h3>
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
                      : 'bg-gray-700 opacity-50'
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
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Thanks for voting! Your support helps determine the winner.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingPage;