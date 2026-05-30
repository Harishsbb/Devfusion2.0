import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
  MessageSquare, Users, Hand, Circle, Square, Maximize2, Minimize2,
  Send, Pin, Smile, Code2, Reply, Search, X, Sparkles, Loader2,
  Clock, Copy, CheckSquare, ListChecks, Plus, AlertTriangle,
} from 'lucide-react';
import { meetingAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import useWorkspaceStore from '../store/workspaceStore';
import {
  getSocket, joinMeetingRoom, leaveMeetingRoom,
  emitMediaState, emitHandRaise, emitRecordingStart, emitRecordingStop,
  emitNewPeer, emitWebRTCOffer, emitWebRTCAnswer, emitWebRTCIce,
} from '../lib/socket';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

// ─── WebRTC config ────────────────────────────────────────────────────────────
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🤔', '💡'];
const CODE_LANGS = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'css', 'html', 'sql', 'bash'];

// ─── Video tile ───────────────────────────────────────────────────────────────
function VideoTile({ stream, participant, isLocal, isMuted, isCameraOff, isSpeaking }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (stream) {
      vid.srcObject = stream;
      vid.play().catch(() => {});
    } else {
      vid.srcObject = null;
    }
  }, [stream]);

  const initials = participant?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-blue-600', 'bg-teal-600', 'bg-emerald-600'];
  const color = colors[(participant?.name?.charCodeAt(0) || 0) % colors.length];
  const hasVideoTrack = stream && stream.getVideoTracks().length > 0;
  const showVideo = hasVideoTrack && !isCameraOff;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center aspect-video transition-shadow ${
        isSpeaking ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-gray-950 shadow-lg shadow-green-500/20' : 'ring-1 ring-white/[0.07]'
      }`}
    >
      {/* Real video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Avatar fallback when camera off or no stream */}
      {!showVideo && (
        <div className="flex flex-col items-center justify-center gap-2 z-10">
          <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
            {participant?.avatar
              ? <img src={participant.avatar} alt="" className="w-full h-full object-cover rounded-full" />
              : initials
            }
          </div>
          {isCameraOff && stream && (
            <span className="text-xs text-gray-500">Camera off</span>
          )}
          {!stream && (
            <span className="text-xs text-gray-600">Connecting…</span>
          )}
        </div>
      )}

      {/* Top badges */}
      <div className="absolute top-2 left-2 flex gap-1.5 z-20">
        {isLocal && (
          <span className="text-[10px] bg-indigo-600/90 text-white px-2 py-0.5 rounded-full font-medium">You</span>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-1.5">
          {isMuted
            ? <MicOff size={11} className="text-red-400 flex-shrink-0" />
            : <Mic size={11} className="text-green-400 flex-shrink-0" />
          }
          <span className="text-xs font-medium text-white truncate max-w-28">
            {participant?.name || 'Participant'}
          </span>
        </div>
        {isSpeaking && !isMuted && (
          <div className="flex items-end gap-0.5 h-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="w-0.5 bg-green-400 rounded-full"
                style={{ height: `${25 + i * 25}%`, animation: `bounce 0.8s ${i * 0.1}s infinite alternate` }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Screen share tile ────────────────────────────────────────────────────────
function ScreenShareView({ stream, sharerName, onStop, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && stream) {
      vid.srcObject = stream;
      vid.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="relative flex-1 rounded-2xl overflow-hidden bg-gray-950 ring-1 ring-blue-500/40">
      <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-contain" />
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-blue-600/90 rounded-xl px-3 py-1.5 text-xs text-white font-medium">
        <Monitor size={12} />
        {isLocal ? 'You are sharing your screen' : `${sharerName} is sharing`}
      </div>
      {isLocal && (
        <button
          onClick={onStop}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors shadow-lg"
        >
          <MonitorOff size={13} /> Stop Sharing
        </button>
      )}
    </div>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────
function ChatMessage({ msg, currentUserId, onReact, onPin, onReply }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const isOwn = (msg.sender?._id || msg.sender) === currentUserId;

  if (msg.type === 'system') {
    return (
      <div className="text-center py-1">
        <span className="text-[11px] text-gray-600 bg-white/[0.04] px-3 py-1 rounded-full">{msg.message}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      <Avatar user={msg.sender} size="xs" className="flex-shrink-0 mt-1" />
      <div className={`max-w-[82%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.sender?.name}</span>}
        <div className={`relative rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isOwn ? 'bg-indigo-600/80 text-white rounded-br-sm' : 'bg-white/[0.08] text-gray-200 rounded-bl-sm'
        }`}>
          {msg.isPinned && <Pin size={9} className="absolute -top-1.5 right-2 text-yellow-400" />}
          {msg.type === 'code' ? (
            <>
              <p className="text-[10px] opacity-60 mb-1 flex items-center gap-1"><Code2 size={9} />{msg.codeLanguage || 'code'}</p>
              <pre className="text-xs font-mono bg-black/40 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">{msg.message}</pre>
            </>
          ) : (
            <p className="break-words">{msg.message}</p>
          )}
        </div>
        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {msg.reactions.map((r, i) => (
              <button key={i} onClick={() => onReact(msg._id, r.emoji)}
                className="text-xs bg-white/[0.08] hover:bg-white/[0.15] rounded-full px-2 py-0.5 transition-colors">
                {r.emoji} {r.users?.length || 0}
              </button>
            ))}
          </div>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5 mt-1 px-1">
          <div className="relative">
            <button onClick={() => setShowEmoji(v => !v)} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"><Smile size={11} /></button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-7 flex gap-1 bg-gray-800 border border-white/10 rounded-xl px-2 py-1.5 shadow-xl z-30`}>
                  {EMOJI_LIST.map(e => (
                    <button key={e} onClick={() => { onReact(msg._id, e); setShowEmoji(false); }} className="text-base hover:scale-125 transition-transform">{e}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => onPin(msg._id)} className={`p-1 rounded hover:bg-white/10 transition-colors ${msg.isPinned ? 'text-yellow-400' : 'text-gray-500'}`}><Pin size={11} /></button>
          <button onClick={() => onReply(msg)} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"><Reply size={11} /></button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AI summary panel ─────────────────────────────────────────────────────────
function AISummaryPanel({ summary, onClose, onConvertTasks, projects }) {
  const [selected, setSelected] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [converting, setConverting] = useState(false);

  const toggle = (i) => setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  const handle = async () => {
    if (!projectId) return toast.error('Select a project');
    if (!selected.length) return toast.error('Select action items');
    setConverting(true);
    try {
      await onConvertTasks(selected.map(i => summary.actionItems[i]), projectId);
      toast.success('Tasks created!');
      setSelected([]);
    } finally { setConverting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="absolute inset-y-0 right-0 w-80 bg-gray-950 border-l border-white/[0.08] flex flex-col z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2"><Sparkles size={14} className="text-purple-400" /><span className="font-semibold text-white text-sm">AI Summary</span></div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-gray-500 transition-colors"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {summary.summary && (
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Summary</h4>
            <p className="text-gray-300 text-xs leading-relaxed">{summary.summary}</p>
          </div>
        )}
        {summary.keyDecisions?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Key Decisions</h4>
            {summary.keyDecisions.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-300 mb-1">
                <CheckSquare size={11} className="text-green-400 mt-0.5 flex-shrink-0" />{d}
              </div>
            ))}
          </div>
        )}
        {summary.actionItems?.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              Action Items {selected.length > 0 && <span className="text-indigo-400 normal-case font-normal">{selected.length} selected</span>}
            </h4>
            {summary.actionItems.map((item, i) => (
              <button key={i} onClick={() => toggle(i)}
                className={`w-full flex items-start gap-2 text-left px-3 py-2 rounded-xl text-xs mb-1.5 transition-colors ${
                  selected.includes(i) ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300' : 'bg-white/[0.04] border border-white/[0.06] text-gray-300 hover:bg-white/[0.07]'
                }`}>
                <ListChecks size={11} className={`mt-0.5 flex-shrink-0 ${selected.includes(i) ? 'text-indigo-400' : 'text-gray-500'}`} />
                <div>
                  <p>{item.text}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{item.assignee} · {item.priority}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {summary.notes && (
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes</h4>
            <div className="bg-white/[0.04] rounded-xl p-3 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{summary.notes}</div>
          </div>
        )}
      </div>
      {summary.actionItems?.length > 0 && (
        <div className="p-4 border-t border-white/[0.08] space-y-3">
          <select value={projectId} onChange={e => setProjectId(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 transition-colors">
            <option value="">Select project…</option>
            {projects?.map(p => <option key={p._id} value={p._id}>{p.emoji} {p.name}</option>)}
          </select>
          <button onClick={handle} disabled={converting || !selected.length || !projectId}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {converting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Convert to Tasks
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MeetingRoomPage() {
  const { workspaceId, meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useWorkspaceStore();

  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaError, setMediaError] = useState(null); // null | 'denied' | 'notfound'

  // Media controls (UI state — also mirrors actual track state)
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Streams
  const [localStream, setLocalStream] = useState(null);        // camera + mic
  const [screenStream, setScreenStream] = useState(null);      // screen share
  const [remoteStreams, setRemoteStreams] = useState({});       // userId -> MediaStream
  const [remoteMediaStates, setRemoteMediaStates] = useState({}); // userId -> { isMuted, isCameraOff }

  // Refs (persist across renders without triggering re-render)
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({});           // userId -> RTCPeerConnection
  const iceBufRef = useRef({});          // userId -> ICECandidate[] (buffered)

  // Panels & UI
  const [activePanel, setActivePanel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState('text');
  const [codeLang, setCodeLang] = useState('javascript');
  const [replyTo, setReplyTo] = useState(null);
  const [chatSearch, setChatSearch] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [duration, setDuration] = useState(0);
  const [speakingId, setSpeakingId] = useState(null); // remote speaking simulation

  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  // ── Fetch projects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (projects.length === 0) fetchProjects(workspaceId).catch(() => {});
  }, [workspaceId, projects.length, fetchProjects]);

  // ── Get local media stream ─────────────────────────────────────────────────
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('denied');
        toast.error('Camera/mic blocked. Allow access in browser settings and rejoin.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        // Try audio only
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsCameraOff(true);
          setMediaError('notfound');
          toast('No camera found — joining with audio only', { icon: '🎤' });
          return audioStream;
        } catch {
          setMediaError('notfound');
          toast.error('No camera or microphone found.');
        }
      } else {
        setMediaError('error');
        console.error('getUserMedia error:', err);
      }
      return null;
    }
  }, []);

  // ── WebRTC helpers ─────────────────────────────────────────────────────────
  const createPeer = useCallback((remoteUserId) => {
    // Close any existing connection for this user
    if (peersRef.current[remoteUserId]) {
      peersRef.current[remoteUserId].close();
    }
    iceBufRef.current[remoteUserId] = [];

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peersRef.current[remoteUserId] = pc;

    // Add all local tracks
    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream));

    // Send ICE candidates to the remote peer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) emitWebRTCIce(remoteUserId, candidate);
    };

    // Receive remote tracks
    pc.ontrack = ({ streams }) => {
      if (streams?.[0]) {
        setRemoteStreams(prev => ({ ...prev, [remoteUserId]: streams[0] }));
      }
    };

    // Handle disconnection
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setRemoteStreams(prev => { const n = { ...prev }; delete n[remoteUserId]; return n; });
        delete peersRef.current[remoteUserId];
      }
    };

    return pc;
  }, []);

  const flushIce = useCallback(async (remoteUserId) => {
    const pc = peersRef.current[remoteUserId];
    if (!pc) return;
    const buf = iceBufRef.current[remoteUserId] || [];
    for (const c of buf) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    iceBufRef.current[remoteUserId] = [];
  }, []);

  // Called when a new participant joins and wants offers from us
  const handleNewPeer = useCallback(async (remoteUserId) => {
    const pc = createPeer(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    emitWebRTCOffer(remoteUserId, offer);
  }, [createPeer]);

  // Called when we receive an offer (we were already in the room)
  const handleOffer = useCallback(async (fromUserId, offer) => {
    const pc = createPeer(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIce(fromUserId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    emitWebRTCAnswer(fromUserId, answer);
  }, [createPeer, flushIce]);

  // Called when we receive an answer to our offer
  const handleAnswer = useCallback(async (fromUserId, answer) => {
    const pc = peersRef.current[fromUserId];
    if (!pc || pc.signalingState === 'stable') return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await flushIce(fromUserId);
  }, [flushIce]);

  // Called when we receive an ICE candidate
  const handleIce = useCallback(async (fromUserId, candidate) => {
    const pc = peersRef.current[fromUserId];
    if (!pc || !pc.remoteDescription) {
      // Buffer until remote description arrives
      if (!iceBufRef.current[fromUserId]) iceBufRef.current[fromUserId] = [];
      iceBufRef.current[fromUserId].push(candidate);
      return;
    }
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
  }, []);

  // ── Load meeting data ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await meetingAPI.get(workspaceId, meetingId);
        setMeeting(data.meeting);
        setChatMessages(data.meeting.chat || []);
        if (data.meeting.aiSummary?.generatedAt) setAiSummary(data.meeting.aiSummary);
        setIsRecording(data.meeting.recording?.isRecording || false);
        if (data.meeting.startedAt) {
          setDuration(Math.floor((Date.now() - new Date(data.meeting.startedAt)) / 1000));
        }
      } catch {
        toast.error('Meeting not found');
        navigate(`/workspace/${workspaceId}/meetings`);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [workspaceId, meetingId, navigate]);

  // ── Init media, join room, signal ───────────────────────────────────────────
  useEffect(() => {
    if (!meeting) return;

    let joined = false;

    (async () => {
      await initMedia();

      // Join socket room
      joinMeetingRoom(meeting.meetingId);
      joined = true;

      // Tell existing participants to send us offers
      emitNewPeer(meeting.meetingId);

      // Notify backend we joined
      meetingAPI.join(workspaceId, meetingId).catch(() => {});
    })();

    return () => {
      if (joined) {
        leaveMeetingRoom(meeting.meetingId);
        meetingAPI.leave(workspaceId, meetingId).catch(() => {});
      }
      // Stop all media
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      // Close all peer connections
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      iceBufRef.current = {};
    };
  }, [meeting?.meetingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!meeting) return;
    const socket = getSocket();
    if (!socket) return;

    const onNewPeer = ({ userId }) => {
      if (userId === user?._id) return;
      handleNewPeer(userId);
    };
    const onOffer = ({ from, offer }) => handleOffer(from, offer);
    const onAnswer = ({ from, answer }) => handleAnswer(from, answer);
    const onIce = ({ from, candidate }) => handleIce(from, candidate);

    const onUserJoined = ({ user: u }) => {
      toast(`${u.name} joined`, { icon: '👋', duration: 3000 });
      setMeeting(prev => {
        if (!prev || prev.attendees?.find(a => a.user?._id === u._id)) return prev;
        return { ...prev, attendees: [...(prev.attendees || []), { user: u, status: 'joined', role: 'participant' }] };
      });
    };
    const onUserLeft = ({ userId: uid, name }) => {
      toast(`${name} left`, { duration: 2500 });
      setRemoteStreams(prev => { const n = { ...prev }; delete n[uid]; return n; });
      if (peersRef.current[uid]) { peersRef.current[uid].close(); delete peersRef.current[uid]; }
    };
    const onMessage = (msg) => {
      setChatMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    };
    const onMediaUpdate = ({ userId: uid, isMuted: m, isCameraOff: c }) => {
      setRemoteMediaStates(prev => ({ ...prev, [uid]: { isMuted: m, isCameraOff: c } }));
    };
    const onHandRaised = ({ name, raised }) => {
      if (raised) toast(`${name} raised hand ✋`, { duration: 3000 });
    };
    const onRecStart = ({ startedBy }) => { setIsRecording(true); toast(`${startedBy} started recording 🔴`); };
    const onRecStop = () => { setIsRecording(false); toast('Recording stopped ⏹️'); };
    const onEnded = () => { toast('Meeting ended by host', { icon: '📴', duration: 4000 }); navigate(`/workspace/${workspaceId}/meetings`); };

    socket.on('meeting:webrtc-new-peer', onNewPeer);
    socket.on('meeting:webrtc-offer', onOffer);
    socket.on('meeting:webrtc-answer', onAnswer);
    socket.on('meeting:webrtc-ice', onIce);
    socket.on('meeting:user-joined', onUserJoined);
    socket.on('meeting:user-left', onUserLeft);
    socket.on('meeting:message', onMessage);
    socket.on('meeting:media-update', onMediaUpdate);
    socket.on('meeting:hand-raised', onHandRaised);
    socket.on('meeting:recording-started', onRecStart);
    socket.on('meeting:recording-stopped', onRecStop);
    socket.on('meeting:ended', onEnded);

    return () => {
      socket.off('meeting:webrtc-new-peer', onNewPeer);
      socket.off('meeting:webrtc-offer', onOffer);
      socket.off('meeting:webrtc-answer', onAnswer);
      socket.off('meeting:webrtc-ice', onIce);
      socket.off('meeting:user-joined', onUserJoined);
      socket.off('meeting:user-left', onUserLeft);
      socket.off('meeting:message', onMessage);
      socket.off('meeting:media-update', onMediaUpdate);
      socket.off('meeting:hand-raised', onHandRaised);
      socket.off('meeting:recording-started', onRecStart);
      socket.off('meeting:recording-stopped', onRecStop);
      socket.off('meeting:ended', onEnded);
    };
  }, [meeting, user?._id, workspaceId, navigate, handleNewPeer, handleOffer, handleAnswer, handleIce]);

  // ── Duration timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Media controls ──────────────────────────────────────────────────────────
  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) stream.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    const next = !isMuted;
    setIsMuted(next);
    emitMediaState({ meetingId: meeting.meetingId, isMuted: next, isCameraOff, isScreenSharing });
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (stream) stream.getVideoTracks().forEach(t => { t.enabled = isCameraOff; });
    const next = !isCameraOff;
    setIsCameraOff(next);
    emitMediaState({ meetingId: meeting.meetingId, isMuted, isCameraOff: next, isScreenSharing });
  };

  const startScreenShare = async () => {
    try {
      const sStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: false,
      });
      screenStreamRef.current = sStream;
      setScreenStream(sStream);
      setIsScreenSharing(true);

      const screenTrack = sStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
      });

      emitMediaState({ meetingId: meeting.meetingId, isMuted, isCameraOff, isScreenSharing: true });
      toast('Screen sharing started', { icon: '🖥️' });

      // Browser native stop button
      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      if (err.name !== 'NotAllowedError') toast.error('Screen sharing failed');
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);

    // Restore camera track
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(camTrack).catch(() => {});
      });
    }
    emitMediaState({ meetingId: meeting.meetingId, isMuted, isCameraOff, isScreenSharing: false });
    toast('Screen sharing stopped');
  };

  const toggleRecording = () => {
    if (!isRecording) { setIsRecording(true); emitRecordingStart(meeting.meetingId); toast('Recording started 🔴'); }
    else { setIsRecording(false); emitRecordingStop(meeting.meetingId); toast('Recording stopped ⏹️'); }
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    emitHandRaise({ meetingId: meeting.meetingId, raised: next });
    toast(next ? 'Hand raised ✋' : 'Hand lowered', { duration: 2000 });
  };

  const handleEndOrLeave = async () => {
    const isHost = meeting?.organizer?._id === user?._id;
    try {
      if (isHost) await meetingAPI.end(workspaceId, meetingId);
      else await meetingAPI.leave(workspaceId, meetingId);
      navigate(`/workspace/${workspaceId}/meetings`);
    } catch {
      navigate(`/workspace/${workspaceId}/meetings`);
    }
  };

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    try {
      const data = await meetingAPI.sendChat(workspaceId, meetingId, {
        message: text,
        type: chatType,
        codeLanguage: chatType === 'code' ? codeLang : undefined,
        replyTo: replyTo?._id,
      });
      setChatMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]);
      setChatInput('');
      setReplyTo(null);
      setChatType('text');
    } catch { toast.error('Send failed'); }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      const data = await meetingAPI.reactToMessage(workspaceId, meetingId, msgId, { emoji });
      setChatMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: data.reactions } : m));
    } catch {}
  };

  const handlePin = async (msgId) => {
    try {
      const data = await meetingAPI.pinMessage(workspaceId, meetingId, msgId);
      setChatMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: data.isPinned } : m));
    } catch {}
  };

  const generateAI = async () => {
    setGeneratingAI(true);
    try {
      const data = await meetingAPI.generateAISummary(workspaceId, meetingId);
      setAiSummary(data.aiSummary);
      setActivePanel('ai');
      toast.success('AI summary ready!');
    } catch { toast.error('Failed to generate summary'); }
    finally { setGeneratingAI(false); }
  };

  const convertTasks = async (items, pid) => {
    await meetingAPI.convertToTasks(workspaceId, meetingId, { items, projectId: pid });
  };

  // ── Derived UI values ───────────────────────────────────────────────────────
  const fmtDur = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const isHost = meeting?.organizer?._id === user?._id;
  const activeAttendees = meeting?.attendees?.filter(a => a.status === 'joined') || [];

  // Build participant tiles: local first, then remotes
  const tiles = [
    { participant: user, stream: isScreenSharing ? null : localStream, isLocal: true, isMuted, isCameraOff },
    ...activeAttendees
      .filter(a => a.user?._id !== user?._id)
      .map(a => ({
        participant: a.user,
        stream: remoteStreams[a.user?._id] || null,
        isLocal: false,
        isMuted: remoteMediaStates[a.user?._id]?.isMuted ?? false,
        isCameraOff: remoteMediaStates[a.user?._id]?.isCameraOff ?? false,
      })),
  ];

  const gridClass = tiles.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
    tiles.length === 2 ? 'grid-cols-2' :
    tiles.length <= 4 ? 'grid-cols-2' :
    tiles.length <= 6 ? 'grid-cols-3' : 'grid-cols-4';

  const filteredChat = chatSearch
    ? chatMessages.filter(m => m.message?.toLowerCase().includes(chatSearch.toLowerCase()))
    : chatMessages;

  const panelOpen = activePanel && activePanel !== 'ai';

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-indigo-400 mx-auto" />
          <p className="text-gray-400 text-sm">Joining meeting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gray-950 text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[100] h-screen' : 'h-screen'}`}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gray-950 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-sm text-white truncate max-w-48">{meeting?.title || 'Meeting'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/[0.05] rounded-lg px-2.5 py-1">
            <Clock size={11} />{fmtDur(duration)}
          </div>
          {isRecording && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Recording
            </div>
          )}
          {mediaError === 'denied' && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1">
              <AlertTriangle size={11} />Camera/mic blocked
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(meeting?.meetingId || ''); toast.success('ID copied!'); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors font-mono"
          >
            <Copy size={11} />{meeting?.meetingId}
          </button>
          <button onClick={() => setIsFullscreen(v => !v)} className="p-1.5 rounded-lg hover:bg-white/[0.1] text-gray-500 transition-colors">
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── Video area ── */}
        <div className="flex flex-1 flex-col min-h-0">

          {/* Video grid */}
          <div className="flex-1 p-4 overflow-hidden flex gap-3">
            {/* Screen share main view */}
            {isScreenSharing && screenStream && (
              <ScreenShareView
                stream={screenStream}
                sharerName={user?.name}
                isLocal
                onStop={stopScreenShare}
              />
            )}
            {/* Check for remote screen share */}
            {!isScreenSharing && Object.entries(remoteStreams).map(([uid, stream]) => {
              if (!stream) return null;
              const hasMultipleStreams = stream.getVideoTracks().length > 1;
              return null; // remote screen share handled by regular tile
            })}

            {/* Participant grid */}
            <div className={`${isScreenSharing ? 'w-48 flex flex-col gap-2 flex-shrink-0' : `flex-1 grid ${gridClass} gap-3 content-center`}`}>
              <AnimatePresence>
                {tiles.map(({ participant, stream, isLocal, isMuted: m, isCameraOff: c }, i) => (
                  <VideoTile
                    key={isLocal ? 'local' : participant?._id || i}
                    stream={stream}
                    participant={participant}
                    isLocal={isLocal}
                    isMuted={m}
                    isCameraOff={c}
                    isSpeaking={!isLocal && speakingId === participant?._id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Controls bar ── */}
          <div className="flex items-center justify-center gap-2 px-4 py-4 border-t border-white/[0.06] flex-shrink-0 flex-wrap">

            {/* Mic */}
            <ControlBtn
              onClick={toggleMute}
              active={isMuted}
              activeColor="red"
              icon={isMuted ? MicOff : Mic}
              label={isMuted ? 'Unmute' : 'Mute'}
            />

            {/* Camera */}
            <ControlBtn
              onClick={toggleCamera}
              active={isCameraOff}
              activeColor="red"
              icon={isCameraOff ? VideoOff : Video}
              label={isCameraOff ? 'Start Cam' : 'Stop Cam'}
              disabled={mediaError === 'denied'}
            />

            {/* Screen share */}
            <ControlBtn
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              active={isScreenSharing}
              activeColor="blue"
              icon={isScreenSharing ? MonitorOff : Monitor}
              label={isScreenSharing ? 'Stop Share' : 'Share'}
            />

            {/* Raise hand */}
            <ControlBtn
              onClick={toggleHand}
              active={handRaised}
              activeColor="yellow"
              icon={Hand}
              label={handRaised ? 'Lower Hand' : 'Raise Hand'}
            />

            {/* Chat */}
            <ControlBtn
              onClick={() => setActivePanel(p => p === 'chat' ? null : 'chat')}
              active={activePanel === 'chat'}
              activeColor="indigo"
              icon={MessageSquare}
              label="Chat"
              badge={activePanel !== 'chat' && chatMessages.filter(m => m.type !== 'system').length}
            />

            {/* Participants */}
            <ControlBtn
              onClick={() => setActivePanel(p => p === 'participants' ? null : 'participants')}
              active={activePanel === 'participants'}
              activeColor="indigo"
              icon={Users}
              label={`People (${tiles.length})`}
            />

            {/* Record (host only) */}
            {isHost && (
              <ControlBtn
                onClick={toggleRecording}
                active={isRecording}
                activeColor="red"
                icon={isRecording ? Square : Circle}
                label={isRecording ? 'Stop Rec' : 'Record'}
              />
            )}

            {/* AI Notes */}
            <ControlBtn
              onClick={generateAI}
              active={activePanel === 'ai'}
              activeColor="purple"
              icon={generatingAI ? Loader2 : Sparkles}
              label="AI Notes"
              disabled={generatingAI}
              spin={generatingAI}
            />

            {/* Leave / End */}
            <button
              onClick={handleEndOrLeave}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white transition-colors ml-2"
            >
              <PhoneOff size={20} />
              <span className="text-[10px] font-medium">{isHost ? 'End' : 'Leave'}</span>
            </button>
          </div>
        </div>

        {/* ── Side panels ── */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              key={activePanel}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col border-l border-white/[0.06] bg-gray-950 overflow-hidden flex-shrink-0"
              style={{ width: 320 }}
            >
              {/* Chat panel */}
              {activePanel === 'chat' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                    <span className="font-semibold text-sm text-white">Meeting Chat</span>
                    <button onClick={() => setActivePanel(null)} className="p-1 rounded-lg hover:bg-white/10 text-gray-500 transition-colors"><X size={14} /></button>
                  </div>
                  <div className="px-3 py-2 border-b border-white/[0.06] flex-shrink-0">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Search…"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                    {filteredChat.length === 0
                      ? <p className="text-center text-xs text-gray-600 py-8">No messages yet</p>
                      : filteredChat.map((msg, i) => (
                        <ChatMessage key={msg._id || i} msg={msg} currentUserId={user?._id}
                          onReact={handleReact} onPin={handlePin} onReply={setReplyTo} />
                      ))
                    }
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t border-white/[0.06] p-3 space-y-2 flex-shrink-0">
                    {replyTo && (
                      <div className="flex items-center gap-2 bg-white/[0.05] rounded-lg px-3 py-1.5">
                        <Reply size={10} className="text-indigo-400" />
                        <p className="text-[11px] text-gray-400 truncate flex-1">{replyTo.message}</p>
                        <button onClick={() => setReplyTo(null)} className="text-gray-600 hover:text-gray-400"><X size={10} /></button>
                      </div>
                    )}
                    <div className="flex gap-1 mb-1">
                      {[{ v: 'text', Icon: MessageSquare, l: 'Text' }, { v: 'code', Icon: Code2, l: 'Code' }].map(({ v, Icon, l }) => (
                        <button key={v} onClick={() => setChatType(v)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors ${chatType === v ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>
                          <Icon size={10} />{l}
                        </button>
                      ))}
                      {chatType === 'code' && (
                        <select value={codeLang} onChange={e => setCodeLang(e.target.value)}
                          className="ml-auto bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-gray-400 focus:outline-none">
                          {CODE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                        placeholder={chatType === 'code' ? 'Paste code…' : 'Message…'}
                        rows={chatType === 'code' ? 3 : 1}
                        className={`flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none ${chatType === 'code' ? 'font-mono' : ''}`}
                      />
                      <button onClick={sendChat} disabled={!chatInput.trim()}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 self-end">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Participants panel */}
              {activePanel === 'participants' && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <span className="font-semibold text-sm text-white">Participants <span className="text-gray-500 font-normal">({meeting?.attendees?.length || 0})</span></span>
                    <button onClick={() => setActivePanel(null)} className="p-1 rounded-lg hover:bg-white/10 text-gray-500 transition-colors"><X size={14} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {meeting?.attendees?.map((a, i) => {
                      const p = a.user;
                      const isMe = p?._id === user?._id;
                      const ms = isMe ? { isMuted, isCameraOff } : (remoteMediaStates[p?._id] || {});
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                          <Avatar user={p} size="sm" showOnline />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{p?.name}{isMe && ' (You)'}</p>
                            <p className="text-[11px] text-gray-600">{a.role === 'host' ? '👑 Host' : <span className="capitalize">{a.status}</span>}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {ms.isMuted && <MicOff size={12} className="text-red-400" />}
                            {ms.isCameraOff && <VideoOff size={12} className="text-gray-500" />}
                            {a.status === 'joined' && !ms.isMuted && !ms.isCameraOff && <Mic size={12} className="text-green-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Summary overlay */}
        <AnimatePresence>
          {activePanel === 'ai' && aiSummary && (
            <AISummaryPanel
              summary={aiSummary}
              onClose={() => setActivePanel(null)}
              onConvertTasks={convertTasks}
              projects={projects}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Reusable control button ──────────────────────────────────────────────────
function ControlBtn({ onClick, active, activeColor, icon: Icon, label, badge, disabled, spin }) {
  const colorMap = {
    red: 'bg-red-500/20 border-red-500/40 text-red-400',
    blue: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    indigo: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400',
    purple: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all disabled:opacity-50 ${
        active ? colorMap[activeColor] : 'bg-white/[0.07] border-white/[0.1] text-gray-300 hover:bg-white/[0.13] hover:text-white'
      }`}
    >
      <Icon size={19} className={spin ? 'animate-spin' : ''} />
      <span className="text-[10px] font-medium leading-none opacity-80 whitespace-nowrap">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
