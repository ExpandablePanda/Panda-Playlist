'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Camera, Shield, User as UserIcon, Check, Edit2, X, Loader2, Upload } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; image?: string } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop state
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Initial load from localStorage for speed
    const stored = localStorage.getItem('panda_user');
    if (stored && !user) {
      try { 
        const u = JSON.parse(stored);
        setUser(u);
        setNewName(u.name);
      } catch {}
    }

    // Sync with server session when ready
    if (!isPending) {
      if (session?.user) {
        const u = { 
          name: session.user.name || '', 
          email: session.user.email || '',
          image: session.user.image || undefined
        };
        setUser(u);
        setNewName(u.name);
        localStorage.setItem('panda_user', JSON.stringify(u));
      } else if (!stored) {
        // No session AND no local user - definitely need to sign in
        router.push('/auth/sign-in');
      }
    }
  }, [session, isPending, router, user]);

  if (!mounted || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="h-10 w-32 glass rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    try { await authClient.signOut(); } catch {}
    localStorage.removeItem('panda_user');
    router.push('/');
  };

  const handleUpdateProfile = async (updates: { name?: string, image?: string }) => {
    setLoading(true);
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('panda_user', JSON.stringify(updatedUser));
      
      const { error } = await authClient.updateUser(updates);

      if (error) {
        if (error.status === 401) {
          alert("Your session has expired. Please sign in again.");
          router.push('/auth/sign-in');
          return;
        }
        throw error;
      }
      
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImage(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalCrop = async () => {
    if (!croppingImage) return;
    setLoading(true);
    
    const img = new Image();
    img.src = croppingImage;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minDim = Math.min(img.width, img.height);
    const sourceSize = minDim / zoom;
    const sx = (img.width - sourceSize) / 2 - (offset.x * (img.width / 200));
    const sy = (img.height - sourceSize) / 2 - (offset.y * (img.height / 200));

    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
    const finalBase64 = canvas.toDataURL('image/jpeg', 0.6);
    
    await handleUpdateProfile({ image: finalBase64 });
    setCroppingImage(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const profileImage = user.image;

  return (
    <div className="min-h-screen bg-[#020617] px-4 pt-20 pb-32 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb orb-purple -top-40 -left-40 w-[800px] h-[800px] animate-slow-pulse" />
      <div className="orb orb-purple -bottom-40 -right-40 w-[600px] h-[600px] animate-slow-pulse" style={{ animationDelay: '2s' }} />

      <div className="max-w-md w-full flex flex-col gap-8 relative z-10">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.3)] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-in zoom-in duration-500">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon size={64} className="text-white/80" />
              )}
            </div>
            <button 
              onClick={() => setShowPhotoMenu(!showPhotoMenu)}
              disabled={loading}
              className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform border border-white/20 disabled:opacity-50 z-20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>

            {/* Photo Action Menu */}
            {showPhotoMenu && (
              <div className="absolute -bottom-24 right-0 w-40 glass rounded-2xl border border-white/10 p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-30">
                <button 
                  onClick={() => { fileInputRef.current?.click(); setShowPhotoMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white text-xs font-bold transition-all"
                >
                  <Upload size={14} className="text-violet-400" />
                  Upload New
                </button>
                {user.image && (
                  <button 
                    onClick={() => { 
                      setCroppingImage(user.image!); 
                      setZoom(1); 
                      setOffset({ x: 0, y: 0 });
                      setShowPhotoMenu(false); 
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white text-xs font-bold transition-all"
                  >
                    <Edit2 size={14} className="text-emerald-400" />
                    Adjust Current
                  </button>
                )}
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          
          <div className="text-center w-full">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-10 px-4 rounded-xl bg-white/5 border border-white/20 text-white text-center text-lg font-bold outline-none focus:border-violet-500 transition-all w-full"
                  autoFocus
                />
                <button 
                  onClick={() => handleUpdateProfile({ name: newName })}
                  disabled={loading}
                  className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all"
                >
                  <Check size={18} />
                </button>
                <button 
                  onClick={() => { setIsEditingName(false); setNewName(user.name); }}
                  className="h-10 w-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 group">
                <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            <p className="text-white/40 text-sm mt-1 font-medium">{user.email}</p>
          </div>
        </div>

        {/* Account Details */}
        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-6 border border-white/10 flex items-center gap-5 bg-white/[0.02]">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Mail size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Primary Email</p>
              <p className="text-sm font-bold text-white">{user.email}</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
              Verified
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10 flex items-center gap-5 bg-white/[0.02]">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Shield size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Account Role</p>
              <p className="text-sm font-bold text-white">Studio Owner</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/')}
            className="h-14 rounded-2xl glass border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-3"
          >
            Return to Dashboard
          </button>
          
          <button
            onClick={handleSignOut}
            className="h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-3"
          >
            <LogOut size={16} /> Sign Out of Studio
          </button>
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-4">
          Panda Playlist v0.1.0-alpha
        </p>
      </div>

      {/* Crop Modal */}
      {croppingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setCroppingImage(null)} />
          
          <div className="relative w-full max-w-sm glass rounded-[40px] border border-white/10 p-8 flex flex-col items-center gap-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Adjust Photo</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Drag to position • Scroll to zoom</p>
            </div>

            <div 
              className="h-64 w-64 rounded-full overflow-hidden border-2 border-violet-500/30 relative cursor-move bg-black shadow-2xl"
              onMouseDown={(e) => { setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY }; }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
            >
              <img 
                src={croppingImage} 
                alt="Crop preview" 
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 200ms ease-out'
                }}
                className="h-full w-full object-contain pointer-events-none"
              />
              <div className="absolute inset-0 rounded-full shadow-[0_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none border border-white/20" />
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-white/40 uppercase">Zoom</span>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setCroppingImage(null)}
                className="flex-1 h-14 rounded-2xl glass text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleFinalCrop}
                disabled={loading}
                className="flex-1 h-14 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Crop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
