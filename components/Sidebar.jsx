import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrbis, User } from "@orbisclub/components";
import { LoadingCircle } from "./Icons";
import ReactTimeAgo from 'react-time-ago';
import { getIpfsLink } from "../utils";

function Sidebar() {
  return (
    <aside className="md:w-64 lg:w-80 md:shrink-0 pt-6 pb-12 md:pb-20 border-l border-primary">
      <div className="md:pl-6 lg:pl-10">
        <div className="space-y-6">
          <RecentDiscussions />
        </div>
      </div>
    </aside>
  );
}

const RecentDiscussions = () => {
  const { orbis } = useOrbis();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts(global.orbis_context, true);
    async function loadPosts(context, include_child_contexts) {
      setLoading(true);
      let { data, error } = await orbis.getPosts({
        context: context,
        only_master: true,
        include_child_contexts: include_child_contexts,
        order_by: 'last_reply_timestamp'
      }, 0, 5);
      setLoading(false);

      if(error) {
        console.log("error:", error);
      }
      if(data) {
        setPosts(data);
      }
    }
  }, []);

  return(
    <div>
      <div className="text-xs lowercase text-tertiary font-semibold mb-4">Recent Projects</div>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-4">
            <LoadingCircle />
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post, key) => (
            <Link href={"/post/" + post.stream_id} key={key}>
              <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition duration-150">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                  {post.content?.media && post.content.media[0] ? (
                    <img 
                      src={getIpfsLink(post.content.media[0])} 
                      alt={post.content.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User details={post.creator_details} height={48} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">
                    {post.content.title}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <ReactTimeAgo 
                      date={post.last_reply_timestamp ? post.last_reply_timestamp * 1000 : post.timestamp * 1000} 
                      locale="en-US"
                    />
                    <span className="text-gray-300">•</span>
                    
                    {/* Upvotes Badge */}
                    <div className="flex items-center">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500 mr-1">
                        <path d="M0.840461 10.7C0.210749 11.6989 0.928568 13 2.10935 13L13.8905 13C15.0713 13 15.7891 11.6989 15.1594 10.7L9.26881 1.35638C8.68036 0.422985 7.31948 0.422987 6.73103 1.35638L0.840461 10.7Z" fill="currentColor"/>
                      </svg>
                      <span className="text-blue-600 font-medium">{post.count_likes || 0}</span>
                    </div>
                    
                    <span className="text-gray-300">•</span>
                    
                    {/* Comments Badge */}
                    <div className="flex items-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-500 mr-1">
                        <path d="M7.5 8.25H16.5M7.5 11.25H12M2.25 12.7593C2.25 14.3604 3.37341 15.754 4.95746 15.987C6.08596 16.1529 7.22724 16.2796 8.37985 16.3655C8.73004 16.3916 9.05017 16.5753 9.24496 16.8674L12 21L14.755 16.8675C14.9498 16.5753 15.2699 16.3917 15.6201 16.3656C16.7727 16.2796 17.914 16.153 19.0425 15.9871C20.6266 15.7542 21.75 14.3606 21.75 12.7595V6.74056C21.75 5.13946 20.6266 3.74583 19.0425 3.51293C16.744 3.17501 14.3926 3 12.0003 3C9.60776 3 7.25612 3.17504 4.95747 3.51302C3.37342 3.74593 2.25 5.13956 2.25 6.74064V12.7593Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-green-600 font-medium">{post.count_replies || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center bg-white/10 rounded border border-primary bg-secondary p-6">
            <p className="text-sm text-secondary">No active discussions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
