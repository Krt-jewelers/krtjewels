import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import craftVideo from '@/assets/craftsmanship-video.mp4';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function CraftsmanshipVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const { data: customUrl } = useQuery({
    queryKey: ['site-settings', 'homepage_craftsmanship_video_url'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_craftsmanship_video_url')
        .maybeSingle();
      const v = data?.value;
      return typeof v === 'string' && v.length > 0 ? v : '';
    },
  });

  const videoSrc = customUrl || craftVideo;

  useEffect(() => {
    const v = videoRef.current;
    const s = sectionRef.current;
    if (!v || !s) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(s);
    return () => obs.disconnect();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-rich-black overflow-hidden">
      <div className="relative w-full h-[60vh] md:h-[80vh] max-h-[720px]">
        <video
          ref={videoRef}
          src={videoSrc}
          key={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        {/* cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-rich-black/40 via-rich-black/10 to-rich-black/80" />

        {/* content */}
        <div className="relative z-10 h-full flex flex-col justify-end px-6 md:px-16 pb-12 md:pb-20 max-w-7xl mx-auto">
          <span className="text-primary text-xs md:text-sm tracking-[0.3em] uppercase mb-3 md:mb-4 font-medium">
            The Art of Craftsmanship
          </span>
          <h2 className="font-serif text-white text-3xl md:text-5xl lg:text-6xl leading-tight max-w-2xl">
            Crafted by hand. <br className="hidden md:block" />
            Worn for generations.
          </h2>
          <p className="text-white/80 text-sm md:text-base mt-4 md:mt-6 max-w-xl leading-relaxed">
            Every KRT piece is shaped by master artisans — a quiet ritual of fire, file, and finish that turns precious metal into heirloom jewellery.
          </p>
        </div>

        {/* controls */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20 flex gap-2">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            className={cn(
              'w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20',
              'flex items-center justify-center text-white hover:bg-white/20 transition'
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            className={cn(
              'w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20',
              'flex items-center justify-center text-white hover:bg-white/20 transition'
            )}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
