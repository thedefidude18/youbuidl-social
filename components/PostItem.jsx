import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, useOrbis } from "@orbisclub/components";
import { shortAddress } from "../utils";
import { CommentsIcon, ShareIcon } from "./Icons";
import ReactTimeAgo from 'react-time-ago';

export default function PostItem({ post, isLastPost }) {
  const { orbis, user } = useOrbis();
  const [hasLiked, setHasLiked] = useState(false);
  const [updatedPost, setUpdatedPost] = useState(post);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle missing post data
  if (!post) {
    return <div>No post data available.</div>;
  }

  /** Check if user liked this post */
  useEffect(() => {
    if (user) {
      getReaction();
    }

    async function getReaction() {
      try {
        let { data, error } = await orbis.getReaction(post.stream_id, user.did);
        if (data && data.type === "like") {
          setHasLiked(true);
        }
      } catch (error) {
        console.error("Error fetching reaction:", error);
      }
    }
  }, [user]);

  /** Will like / upvote the post */
  async function like() {
    if (user) {
      setHasLiked(true);
      setIsAnimating(true); // Trigger animation
      setUpdatedPost({
        ...updatedPost,
        count_likes: post.count_likes + 1,
      });
      try {
        let res = await orbis.react(post.stream_id, "like");
        console.log("res:", res);
      } catch (error) {
        console.error("Error liking post:", error);
      } finally {
        setTimeout(() => setIsAnimating(false), 500);
      }
    } else {
      alert("You must be connected to react to posts.");
    }
  }

  /** Will clean description by shortening it and remove some markdown structure */
  function cleanDescription() {
    if (post.content?.body) {
      let desc = post.content.body;
      const regexImage = /\!\[Image ALT tag\]\((.*?)\)/;
      const regexUrl = /\[(.*?)\]\(.*?\)/;
      desc = desc.replace(regexImage, "");
      desc = desc.replace(regexUrl, "$1");

      if (desc) {
        return desc.substring(0, 180) + "...";
      }
    }
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
        <div className="flex flex-row items-start space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <User details={post.creator_details} height={48} />
          </div>

          {/* Post Content */}
          <div className="flex-1">
            {/* User Info and Timestamp */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {post.creator_details?.profile?.username || shortAddress(post.creator_details.metadata?.address)}
              </span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-500">
                <ReactTimeAgo date={post.timestamp * 1000} />
              </span>
            </div>

            {/* Post Title */}
            <h2 className="text-lg font-semibold text-gray-900 mt-1">
              <Link href={"/post/" + post.stream_id} className="hover:underline">
                {post.content?.title || "Untitled Post"}
              </Link>
            </h2>

            {/* Post Description */}
            <p className="text-sm text-gray-700 mt-1">{cleanDescription()}</p>

            {/* Post Actions (Upvote, Comments, Share, Proof Badge) */}
            <div className="flex items-center mt-3 space-x-6 text-gray-500">
              {/* Upvote Button */}
              <button
                onClick={like}
                className={`flex items-center space-x-1 hover:text-blue-500 transition-colors duration-200 ${
                  isAnimating ? 'animate-bounce' : ''
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${hasLiked ? 'text-blue-500' : 'text-gray-500'}`}
                  fill={hasLiked ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <span>{updatedPost.count_likes}</span>
              </button>

              {/* Comments Count */}
              {post.count_replies && post.count_replies > 0 && (
                <Link
                  href={"/post/" + post.stream_id}
                  className="flex items-center space-x-1 hover:text-blue-500 transition-colors duration-200"
                >
                  <CommentsIcon className="w-5 h-5" />
                  <span>{post.count_replies}</span>
                </Link>
              )}

              {/* Share Button */}
              <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors duration-200">
                <ShareIcon className="w-5 h-5" />
                <span>Share</span>
              </button>

              {/* Proof Badge */}
              {post.stream_id && (
                <a
                  href={`https://cerscan.com/${post.stream_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-blue-500 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Proof</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add a divider after each post except the last one */}
      {!isLastPost && <hr className="border-t border-gray-200" />}
    </>
  );
}
