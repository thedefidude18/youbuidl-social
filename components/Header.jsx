import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Logo, PanelRight, SearchIcon, MenuVerticalIcon, LoadingCircle } from "./Icons";
import useOutsideClick from "../hooks/useOutsideClick";
import { useOrbis, User, UserPopup, Chat } from "@orbisclub/components";
import { GlobalContext } from "../contexts/GlobalContext";

function Header() {
  const { orbis, user, connecting, setConnectModalVis } = useOrbis();
  const [showCommunityChat, setShowCommunityChat] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    getLastTimeRead();

    async function getLastTimeRead() {
      let { data, error } = await orbis.getContext(global.orbis_chat_context);
      let last_read = localStorage.getItem(global.orbis_chat_context + "-last-read");
      if(last_read) {
        last_read = parseInt(last_read);
      } else {
        last_read = 0;
      }
      if(data && data.last_post_timestamp && (data.last_post_timestamp > last_read)) {
        setHasUnreadMessages(true);
      }
    }
  }, []);

  function openCommunityChat() {
    setShowCommunityChat(true);
    setHasUnreadMessages(false);
  }

  return (
    <>
      <header className="w-full z-30 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="shrink-0 mr-4">
              <Link href="/" className="text-primary">
                <img src="/logo-blue.svg" className="h-8" />
              </Link>
            </div>

            <nav className="flex grow text-primary">
              <ul className="flex justify-between items-center w-full space-x-4">
                <li className="flex items-center">
                  <SearchBar />
                </li>

                {user ?
                  <>
                    <li className="flex items-center relative">
                      <div className="text-sm font-medium flex flex-row items-center space-x-4 rounded hover:bg-slate-300/[.2] px-3 py-2 cursor-pointer" onClick={() => setShowUserMenu(true)}>
                        <User details={user} height={30} />
                        <MenuVerticalIcon />
                      </div>
                      {showUserMenu && <UserMenuVertical hide={() => setShowUserMenu(false)} />}
                    </li>

                    <li className="flex items-center relative">
                      <BadgeNotifications />
                    </li>
                  </>
                : 
                  <li className="ml-3">
                    {connecting ?
                      <div className="btn-sm btn-main w-full" onClick={() => setConnectModalVis(true)}><LoadingCircle style={{marginRight: 3}} /> Connecting</div>
                    :
                      <div className="btn-sm btn-main w-full" onClick={() => setConnectModalVis(true)}>Connect</div>
                    }
                  </li>
                }

                {global.orbis_chat_context && 
                  <li className="ml-3">
                    <div className="relative btn-sm btn-secondary w-full" onClick={() => openCommunityChat()}>
                      Community Chat <PanelRight style={{marginLeft: 5}} />
                      {hasUnreadMessages && <div className="bg-red-500 h-2.5 w-2.5 rounded-full" style={{marginLeft: 6}}></div>}
                    </div>
                  </li>
                }
              </ul>
            </nav>
          </div>
        </div>
      </header>
      {showCommunityChat && <ChatPanel hide={() => setShowCommunityChat(false)} />}
    </>
  );
}

const BadgeNotifications = () => {
  const { orbis } = useOrbis();
  const [countNewNotifs, setCountNewNotifs] = useState();
  const [showNotifPane, setShowNotifPane] = useState(false);

  useEffect(() => {
    const interval = setInterval(loadNotifications, 5000); // run loadNotifications every 5 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const { data } = await orbis.getNotificationsCount({
        type: "social",
        context: global.orbis_context,
        include_child_contexts: true
      });
      setCountNewNotifs(data.count_new_notifications);
    } catch (error) {
      console.log("Error loading notifications:", error);
    }
  }

  return(
    <div className="flex flex-row ml-1" onClick={() => setShowNotifPane(true)}>
      <div className="flex flex-row text-brand-hover rounded hover:bg-slate-300/[.2] px-3 py-2 cursor-pointer">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8569 15.0817C14.7514 14.857 16.5783 14.4116 18.3111 13.7719C16.8743 12.177 15.9998 10.0656 15.9998 7.75V7.04919C15.9999 7.03281 16 7.01641 16 7C16 3.68629 13.3137 1 10 1C6.68629 1 4 3.68629 4 7L3.9998 7.75C3.9998 10.0656 3.12527 12.177 1.68848 13.7719C3.4214 14.4116 5.24843 14.857 7.14314 15.0818M12.8569 15.0817C11.92 15.1928 10.9666 15.25 9.9998 15.25C9.03317 15.25 8.07988 15.1929 7.14314 15.0818M12.8569 15.0817C12.9498 15.3711 13 15.6797 13 16C13 17.6569 11.6569 19 10 19C8.34315 19 7 17.6569 7 16C7 15.6797 7.05019 15.3712 7.14314 15.0818" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {countNewNotifs > 0 && 
          <div className="bg-red-500 rounded-full text-white font-bold py-0.5 px-1.5 text-xs" style={{marginLeft: 6}}>{countNewNotifs}</div>
        }
      </div>

      {showNotifPane && <NotificationsPane setCountNewNotifs={setCountNewNotifs} hide={() => setShowNotifPane(false)} />}
    </div>
  );
};

const NotificationsPane = ({setCountNewNotifs, hide}) => {
  const { orbis } = useOrbis();
  const wrapperRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();

    async function loadNotifications() {
      setNotificationsLoading(true);
      let { data, error } = await orbis.getNotifications({
        type: "social",
        context: global.orbis_context,
        include_child_contexts: true
      });

      if (error) {
        console.log("Error fetching notifications:", error);
      }

      if (data) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }

      setNotificationsLoading(false);
      setCountNewNotifs(0);

      const _content = {
        type: "social",
        context: global.orbis_context,
        timestamp: parseInt(new Date().getTime() / 1000)
      };
      await orbis.setNotificationsReadTime(_content);
    }
  }, []);

  useOutsideClick(wrapperRef, () => hide());

  return (
    <div className="absolute top-[0px] right-[0px] py-10 z-50 w-[355px]">
      <div className="text-sm shadow-md bg-white border border-gray-200 rounded-md flex flex-col w-full divide-y max-h-[600px] overflow-y-scroll" ref={wrapperRef}>
        {notificationsLoading ?
          <div className="w-full px-4 py-5 flex justify-center">
            <LoadingCircle />
          </div>
        : 
          <>
            {notifications.length > 0 ?
              notifications.map((notification, key) => (
                <NotificationItem notification={notification} key={key} />
              ))
              : <p className="p-4 text-gray-600 text-sm">You don't have any notifications here.</p>
            }
          </>
        }
      </div>
    </div>
  );
};

const NotificationItem = ({ notification }) => {
  const NotificationFamily = () => {
    switch (notification.family) {
      case "reply_to": return <>replied:</>;
      case "follow": return <>is following you.</>;
      case "reaction": return <><Reaction />:</>;
      default: return notification.family;
    }
  };

  const Reaction = () => {
    switch (notification.content?.type) {
      case "like": return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand"><path d="M13.875 4.84375C13.875 3.08334 12.3884 1.65625 10.5547 1.65625C9.18362 1.65625 8.00666 2.45403 7.5 3.59242C6.99334 2.45403 5.81638 1.65625 4.44531 1.65625C2.61155 1.65625 1.125 3.08334 1.125 4.84375C1.125 9.95831 7.5 13.3438 7.5 13.3438C7.5 13.3438 13.875 9.95831 13.875 4.84375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
      case "haha": return <span>HAHA!</span>;
      default: return null;
    }
  };

  return (
    <div className={`w-full flex flex-col p-3 ${notification.status === "new" ? "bg-slate-100" : "bg-white"}`}>
      <div className="flex flex-row items-center space-x-2 flex-wrap">
        <User height={35} details={notification.user_notifiying_details} />
        <span className="flex text-sm items-center"><NotificationFamily /></span>
      </div>
      {(notification.family === "reply_to" || notification.family === "reaction") && 
        <div className={`border border-slate-200 p-2 rounded-md shadow-md mt-1.5 ${notification.status === "new" ? "bg-white" : "bg-gray-50"}`}>
          {(notification.post_details && notification.post_details.content && notification.post_details.content.body) ? 
            <Post post={notification.post_details} showPfp={false} showCta={false} />
            : <div><p className="text-italic">Post deleted...</p></div>
          }
        </div>
      }
    </div>
  );
};

export { BadgeNotifications, NotificationsPane, NotificationItem };
