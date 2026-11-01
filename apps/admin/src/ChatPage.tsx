import React, { useEffect, useRef, useState } from 'react';
import { chatApi, type Conversation, type Message } from './api';
import { Avatar, EmptyState, ErrorState, SkeletonList } from './components';
import { maskSensitive, timeAgo } from './utils';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function ChatPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [errorConvs, setErrorConvs] = useState('');
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const msgsEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chatApi.conversations()
      .then(setConversations)
      .catch((e) => setErrorConvs(e.message))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    const token = tokenStore.getAccess();
    if (!token) return;
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;
    socket.on('message:new', (msg: Message) => {
      if (msg.conversationId === activeConv?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        void chatApi.markRead(msg.conversationId);
        socket.emit('message:read', { conversationId: msg.conversationId, messageId: msg.id });
      } else {
        showToast('New message received', 'info');
      }
      setConversations((prev) => prev.map((c) =>
        c.id === msg.conversationId ? { ...c, updatedAt: msg.createdAt } : c,
      ));
    });
    socket.on('typing:start', () => setIsTyping(true));
    socket.on('typing:stop', () => setIsTyping(false));
    return () => { socket.disconnect(); };
  }, [activeConv?.id]);

  const selectConversation = (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    chatApi.messages(conv.id)
      .then(({ data }) => setMessages(data))
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoadingMsgs(false));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeConv) return;
    setSending(true);
    try {
      const msg = await chatApi.send(activeConv.id, msgText);
      setMessages((prev) => [...prev, msg]);
      setMsgText('');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loadingConvs) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-title">Chat</h1>
        <SkeletonList count={5} />
      </div>
    );
  }

  if (errorConvs) {
    return <ErrorState message={errorConvs} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Chat</h1>
        <div>{user?.fullName}</div>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 320, borderRight: '1px solid var(--c-border)', background: 'var(--c-bg)', overflowY: 'auto' }}>
          <div style={{ padding: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Conversations</h2>
            {conversations.length === 0 ? (
              <div style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>No conversations yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {conversations.map((conv) => {
                  const otherUserId = conv.userAId === user?.id ? conv.userBId : conv.userAId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        padding: '10px 12px', border: 'none', background: 'transparent',
                        textAlign: 'left', cursor: 'pointer',
                        borderBottom: activeConv?.id === conv.id ? '2px solid var(--c-primary)' : 'none',
                      }}
                    >
                      <Avatar name={otherUserId} url={null} size={36} trustScore={50} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          User {otherUserId?.slice(-4) ?? 'Unknown'}
                        </div>
                        <div style={{ color: 'var(--c-text-muted)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {timeAgo(conv.updatedAt)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--c-bg)' }}>
          {activeConv ? (
            <>
              <div style={{ padding: 12, borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>
                    Conversation {activeConv.id.slice(-4)}
                  </div>
                  <div style={{ color: 'var(--c-text-muted)', fontSize: 12 }}>Claim-related chat</div>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingMsgs ? (
                  <div style={{ alignSelf: 'center' }}>Loading messages...</div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '70%', padding: '10px 14px', borderRadius: 'var(--r-lg)',
                              background: isMine ? 'var(--c-primary)' : 'var(--c-surface)',
                              color: isMine ? '#fff' : 'var(--c-text)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                          >
                            {msg.type === 'IMAGE' ? (
                              <img src={msg.body} alt='Message' style={{ maxWidth: 200, borderRadius: 'var(--r-md)' }} />
                            ) : (
                              maskSensitive(msg.body)
                            )}
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{timeAgo(msg.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div style={{ fontStyle: 'italic', color: 'var(--c-text-muted)', fontSize: 12 }}>typing...</div>
                    )}
                    <div ref={msgsEndRef} />
                  </>
                )}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type='text'
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder='Type a message...'
                    style={{
                      flex: 1, padding: '10px 14px', border: '1px solid var(--c-border)',
                      borderRadius: 'var(--r-full)', background: '#fff', fontSize: 14,
                    }}
                  />
                  <button type='submit' disabled={sending || !msgText.trim()} className='btn btn-primary' style={{ padding: '10px 20px' }}>
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div>Select a conversation to start chatting</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

