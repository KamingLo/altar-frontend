'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, ChevronsLeft, ChevronsRight,
  ChevronRight, ChevronDown, Menu, LogOut,
} from 'lucide-react';
import type { BufferGeometry, ShaderMaterial, Points } from 'three';
import { useUserStore } from '@/store/useUserStore';
import { asdosMenuItems } from '@/components/dashboard/asdos/AsdosHome';
import { koordinatorMenuItems } from '@/components/dashboard/koordinator/KoordinatorHome';
import { logoutUser } from '@/lib/actions/auth/session';

/* ─── types ─────────────────────────────────── */
interface MenuItem { id: number; title: string; icon: React.ElementType; href: string }
interface MenuGroup { id: string; title: string; items: MenuItem[] }

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearUser } = useUserStore();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  /* clock */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* build menu groups from user role */
  const menuGroups: MenuGroup[] = useMemo(() => {
    const groups: MenuGroup[] = [];
    if (user?.id_koordinator) groups.push({ id: 'koordinator', title: 'Koordinator', items: koordinatorMenuItems });
    if (user?.id_asisten)     groups.push({ id: 'asdos',       title: 'Asdos',       items: asdosMenuItems });
    return groups;
  }, [user]);

  const homeHref = user?.id_koordinator ? '/koordinator' : user?.id_asisten ? '/asdos' : '/';
  const isMultiGroup = menuGroups.length > 1;
  const allItems = menuGroups.flatMap(g => g.items);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const toggleGroup = (id: string) =>
    setOpenGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleLogout = async () => {
    await logoutUser(); clearUser(); router.replace('/auth/login');
  };

  /* initialise all groups open */
  useEffect(() => {
    if (menuGroups.length > 0) setOpenGroups(new Set(menuGroups.map(g => g.id)));
  }, [menuGroups]);

  /* ── Three.js canvas ─────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId: number;
    let cleanupFn: (() => void) | undefined;

    async function init() {
      const THREE = await import('three');

      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
      camera.position.z = 1;

      const state = {
        targets: null as Float32Array | null,
        count: 0,
        positions: null as Float32Array | null,
        seeds: null as Float32Array | null,
        nx: null as Float32Array | null,
        ny: null as Float32Array | null,
        letter: null as Float32Array | null,
        disp: null as Float32Array | null,
        offset: null as Float32Array | null,
        grabbed: null as Uint8Array | null,
        grabRel: null as Float32Array | null,
        geometry: null as BufferGeometry | null,
        material: null as ShaderMaterial | null,
        points: null as Points | null,
        ready: false,
      };

      function buildTextTargets() {
        const text = 'UNTAR';
        const cssH = Math.max(130, Math.min(canvas!.clientHeight * 0.38, 300));
        const fontPx = Math.round(cssH * 0.92);
        const sample = document.createElement('canvas');
        const ctx = sample.getContext('2d')!;
        ctx.font = `900 ${fontPx}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
        const widths: number[] = [];
        let totalW = 0;
        for (const ch of text) { const w = ctx.measureText(ch).width; widths.push(w); totalW += w; }
        const padding = Math.round(fontPx * 0.08);
        const W = Math.ceil(totalW) + padding * 2, H = Math.ceil(fontPx * 1.15) + padding * 2;
        sample.width = W; sample.height = H;
        ctx.font = `900 ${fontPx}px "Helvetica Neue",Helvetica,Arial,sans-serif`;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        const step = Math.max(4, Math.round(fontPx / 46));
        const tx: number[] = [], ty: number[] = [], tl: number[] = [];
        let cx = padding;
        for (let li = 0; li < text.length; li++) {
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#000'; ctx.fillText(text[li], cx, H / 2);
          const img = ctx.getImageData(0, 0, W, H).data;
          for (let y = 0; y < H; y += step)
            for (let x = 0; x < W; x += step)
              if (img[(y * W + x) * 4] < 128) {
                tx.push(x - W / 2 + (Math.random() - 0.5) * step * 0.35);
                ty.push(-(y - H / 2) + (Math.random() - 0.5) * step * 0.35);
                tl.push(li);
              }
          cx += widths[li];
        }
        const N = tx.length;
        state.count = N;
        state.targets = new Float32Array(N * 2);
        state.positions = new Float32Array(N * 3);
        state.seeds = new Float32Array(N);
        state.nx = new Float32Array(N);
        state.ny = new Float32Array(N);
        state.letter = new Float32Array(N);
        state.disp = new Float32Array(N * 2);
        state.offset = new Float32Array(N * 2);
        state.grabbed = new Uint8Array(N);
        state.grabRel = new Float32Array(N * 2);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < N; i++) {
          if (tx[i] < minX) minX = tx[i]; if (tx[i] > maxX) maxX = tx[i];
          if (ty[i] < minY) minY = ty[i]; if (ty[i] > maxY) maxY = ty[i];
        }
        const xR = Math.max(1, maxX - minX), yR = Math.max(1, maxY - minY);
        for (let i = 0; i < N; i++) {
          state.targets![i * 2] = tx[i]; state.targets![i * 2 + 1] = ty[i];
          state.positions![i * 3] = tx[i]; state.positions![i * 3 + 1] = ty[i];
          state.seeds![i] = Math.random();
          state.nx![i] = (tx[i] - minX) / xR;
          state.ny![i] = (ty[i] - minY) / yR * 2 - 1;
          state.letter![i] = tl[i];
        }
        if (!state.geometry) {
          state.geometry = new THREE.BufferGeometry();
          state.geometry.setAttribute('position', new THREE.BufferAttribute(state.positions!, 3));
          state.geometry.setAttribute('aSeed',   new THREE.BufferAttribute(state.seeds!, 1));
          state.geometry.setAttribute('aNx',     new THREE.BufferAttribute(state.nx!, 1));
          state.geometry.setAttribute('aNy',     new THREE.BufferAttribute(state.ny!, 1));
          state.geometry.setAttribute('aLetter', new THREE.BufferAttribute(state.letter!, 1));
          state.material = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false,
            uniforms: {
              uPixelRatio:   { value: renderer.getPixelRatio() },
              uSize:         { value: 3.2 },
              uColor:        { value: new THREE.Color(0x0c0c0d) },
              uAccent:       { value: new THREE.Color(0x941c2f) },
              uTime:         { value: 0 },  uSpeed:        { value: 0.22 },
              uSpread:       { value: 0.95 }, uTilt:       { value: 0.18 },
              uFadeInEnd:    { value: 0.20 }, uFadeOutStart: { value: 0.55 }, uFadeOutEnd: { value: 0.78 },
            },
            vertexShader: `
              uniform float uPixelRatio,uSize,uTime,uSpeed,uSpread,uTilt,uFadeInEnd,uFadeOutStart,uFadeOutEnd;
              attribute float aSeed,aNx,aNy,aLetter;
              varying float vAlpha,vAccent;
              void main(){
                float phase=fract(uTime*uSpeed-(aNx+uTilt*aNy)*uSpread);
                float a=smoothstep(0.0,uFadeInEnd,phase)*(1.0-smoothstep(uFadeOutStart,uFadeOutEnd,phase));
                a*=mix(0.85,1.0,aSeed);
                vAlpha=a;
                vAccent=smoothstep(uFadeInEnd*.7,uFadeInEnd*1.2,phase)*(1.0-smoothstep(uFadeInEnd*1.2,uFadeInEnd*2.0,phase));
                vec3 pos=position;
                pos.x+=sin(uTime*.55+aLetter*1.7)*2.2;
                pos.y+=sin(uTime*.78+aLetter*2.3+1.2)*3.4+sin(uTime*1.1+aSeed*6.28)*.5*a;
                vec4 mv=modelViewMatrix*vec4(pos,1.0);
                gl_PointSize=uSize*uPixelRatio*(0.85+0.4*a);
                gl_Position=projectionMatrix*mv;
              }`,
            fragmentShader: `
              precision highp float;
              uniform vec3 uColor,uAccent;
              varying float vAlpha,vAccent;
              void main(){
                float d=length(gl_PointCoord-.5);
                float disk=smoothstep(.5,.38,d);
                if(disk*vAlpha<=.01) discard;
                gl_FragColor=vec4(mix(uColor,uAccent,vAccent*.55),disk*vAlpha);
              }`,
          });
          state.points = new THREE.Points(state.geometry, state.material);
          scene.add(state.points);
        } else {
          state.geometry.setAttribute('position', new THREE.BufferAttribute(state.positions!, 3));
          state.geometry.setAttribute('aSeed',   new THREE.BufferAttribute(state.seeds!, 1));
          state.geometry.setAttribute('aNx',     new THREE.BufferAttribute(state.nx!, 1));
          state.geometry.setAttribute('aNy',     new THREE.BufferAttribute(state.ny!, 1));
          state.geometry.setAttribute('aLetter', new THREE.BufferAttribute(state.letter!, 1));
        }
        state.ready = true;
      }

      function resize() {
        const w = canvas!.clientWidth, h = canvas!.clientHeight;
        renderer.setSize(w, h, false);
        camera.left = -w / 2; camera.right = w / 2;
        camera.top = h / 2; camera.bottom = -h / 2;
        camera.updateProjectionMatrix();
        if (state.material) state.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        buildTextTargets();
      }

      const clock = new THREE.Clock();
      const mouse = { x: 1e6, y: 1e6, active: false, down: false };
      canvas!.style.cursor = 'default';

      const REPEL_R = 90, REPEL_S = 36, EASE = 0.16, GRAB_R = 80, GRAB_F = 0.45;

      function getPos(e: PointerEvent) {
        const r = canvas!.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) - r.width / 2;
        mouse.y = -((e.clientY - r.top)  - r.height / 2);
        mouse.active = true;
      }
      function onMove(e: PointerEvent) {
        getPos(e);
        if (!state.ready || mouse.down) return;
        /* cursor: grab only when close to a dot */
        const R2 = GRAB_R * GRAB_R;
        let near = false;
        for (let i = 0; i < state.count; i++) {
          const vx = state.targets![i*2]   + state.offset![i*2];
          const vy = state.targets![i*2+1] + state.offset![i*2+1];
          if ((vx - mouse.x)**2 + (vy - mouse.y)**2 < R2) { near = true; break; }
        }
        canvas!.style.cursor = near ? 'grab' : 'default';
      }
      function onLeave() { mouse.active = false; canvas!.style.cursor = 'default'; }
      function onDown(e: PointerEvent) {
        getPos(e);
        if (!state.ready) return;
        let any = false;
        for (let i = 0; i < state.count; i++) {
          const vx = state.targets![i*2]   + state.offset![i*2];
          const vy = state.targets![i*2+1] + state.offset![i*2+1];
          if ((vx - mouse.x)**2 + (vy - mouse.y)**2 < GRAB_R**2) {
            state.grabbed![i] = 1;
            state.grabRel![i*2]   = vx - mouse.x;
            state.grabRel![i*2+1] = vy - mouse.y;
            state.disp![i*2] = 0; state.disp![i*2+1] = 0;
            any = true;
          }
        }
        if (any) { mouse.down = true; canvas!.style.cursor = 'grabbing'; try { canvas!.setPointerCapture(e.pointerId); } catch (_) {} }
      }
      function onUp() {
        if (!state.ready) return;
        for (let i = 0; i < state.count; i++) state.grabbed![i] = 0;
        mouse.down = false; canvas!.style.cursor = 'default';
      }

      canvas!.addEventListener('pointermove',  onMove);
      canvas!.addEventListener('pointerleave', onLeave);
      canvas!.addEventListener('pointerdown',  onDown);
      canvas!.addEventListener('pointerup',    onUp);
      canvas!.addEventListener('pointercancel', onUp);

      function tick() {
        const t = clock.getElapsedTime();
        if (state.ready) {
          state.material!.uniforms.uTime.value = t;
          for (let i = 0; i < state.count; i++) {
            const tx = state.targets![i*2], ty = state.targets![i*2+1];
            if (state.grabbed![i]) {
              state.offset![i*2]   += ((mouse.x + state.grabRel![i*2])   - tx - state.offset![i*2])   * GRAB_F;
              state.offset![i*2+1] += ((mouse.y + state.grabRel![i*2+1]) - ty - state.offset![i*2+1]) * GRAB_F;
              state.disp![i*2] = 0; state.disp![i*2+1] = 0;
            } else {
              let dx = 0, dy = 0;
              if (mouse.active && !mouse.down) {
                const hx = tx + state.offset![i*2], hy = ty + state.offset![i*2+1];
                const mdx = hx - mouse.x, mdy = hy - mouse.y, md2 = mdx*mdx + mdy*mdy;
                if (md2 < REPEL_R**2 && md2 > 0.0001) {
                  const md = Math.sqrt(md2), k = 1 - md / REPEL_R;
                  dx = (mdx/md)*k*k*REPEL_S; dy = (mdy/md)*k*k*REPEL_S;
                }
              }
              state.disp![i*2]   += (dx - state.disp![i*2])   * EASE;
              state.disp![i*2+1] += (dy - state.disp![i*2+1]) * EASE;
            }
            state.positions![i*3]   = tx + state.offset![i*2]   + state.disp![i*2];
            state.positions![i*3+1] = ty + state.offset![i*2+1] + state.disp![i*2+1];
          }
          state.geometry!.attributes.position.needsUpdate = true;
        }
        renderer.render(scene, camera);
        animId = requestAnimationFrame(tick);
      }

      const onResize = () => requestAnimationFrame(resize);
      window.addEventListener('resize', onResize);
      if (document.fonts?.ready) document.fonts.ready.then(() => { resize(); tick(); });
      else { resize(); tick(); }

      cleanupFn = () => {
        window.removeEventListener('resize', onResize);
        canvas!.removeEventListener('pointermove',  onMove);
        canvas!.removeEventListener('pointerleave', onLeave);
        canvas!.removeEventListener('pointerdown',  onDown);
        canvas!.removeEventListener('pointerup',    onUp);
        canvas!.removeEventListener('pointercancel', onUp);
        cancelAnimationFrame(animId);
        renderer.dispose();
        state.geometry?.dispose();
        state.material?.dispose();
      };
    }

    init();
    return () => cleanupFn?.();
  }, []);

  /* ── nav item renderers ─────────────────────── */
  const renderDesktopItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} title={collapsed ? item.title : undefined}
        className={`flex items-center transition-all duration-300 group ${collapsed
          ? `relative justify-center w-[46px] h-[46px] mx-auto rounded-xl ${active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/20'}`
          : `justify-between px-4 py-3 rounded-xl ${active ? 'text-white bg-white/20 border border-white/10' : 'text-white/70 hover:text-white hover:bg-white/20'}`}`}
      >
        {collapsed && active && <span className="absolute left-1.5 bottom-1.5 w-1.5 h-1.5 bg-white rounded-full" />}
        <div className={`flex items-center ${collapsed ? '' : 'gap-3.5'}`}>
          <div className={`shrink-0 flex items-center justify-center transition-all duration-300 ${collapsed ? '' : `p-2.5 rounded-xl ${active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}`}>
            <Icon size={19} className={active ? 'text-white' : 'text-white/60 group-hover:text-white'} />
          </div>
          {!collapsed && <span className="font-bold text-sm tracking-wide whitespace-nowrap">{item.title}</span>}
        </div>
        {!collapsed && (active
          ? <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
          : <ChevronRight size={16} className="text-white/30 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shrink-0" />
        )}
      </Link>
    );
  };

  const renderMobileItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'text-white bg-white/20 border border-white/10' : 'text-white/70 hover:text-white hover:bg-white/20'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
            <Icon size={18} className={active ? 'text-white' : 'text-white/60 group-hover:text-white'} />
          </div>
          <span className="font-semibold text-sm tracking-wide">{item.title}</span>
        </div>
        {active
          ? <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
          : <ChevronRight size={16} className="text-white/30 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
        }
      </Link>
    );
  };

  const renderDesktopNav = () => {
    if (!isMultiGroup) return <div className="space-y-2">{allItems.map(item => renderDesktopItem(item))}</div>;
    return (
      <div className={collapsed ? 'space-y-2' : 'space-y-1'}>
        {menuGroups.map((group, idx) => collapsed ? (
          <div key={group.id}>
            <div className="space-y-2">{group.items.map(item => renderDesktopItem(item))}</div>
            {idx < menuGroups.length - 1 && <div className="h-px bg-white/10 my-3 mx-2" />}
          </div>
        ) : (
          <div key={group.id}>
            <button onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white/50 hover:text-white/80 transition-all duration-200">
              <span className="text-[10px] font-extrabold tracking-widest uppercase">{group.title}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${openGroups.has(group.id) ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            <div className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: openGroups.has(group.id) ? `${group.items.length * 80}px` : '0px' }}>
              <div className="space-y-1 pt-0.5 pb-1">{group.items.map(item => renderDesktopItem(item))}</div>
            </div>
            {idx < menuGroups.length - 1 && <div className="h-px bg-white/10 mt-3 mb-1" />}
          </div>
        ))}
      </div>
    );
  };

  const renderMobileNav = () => {
    if (!isMultiGroup) return <div className="space-y-1">{allItems.map(item => renderMobileItem(item))}</div>;
    return (
      <div className="space-y-1">
        {menuGroups.map((group, idx) => (
          <div key={group.id}>
            <button onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white/50 hover:text-white/80 transition-all duration-200">
              <span className="text-[10px] font-extrabold tracking-widest uppercase">{group.title}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${openGroups.has(group.id) ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            <div className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: openGroups.has(group.id) ? `${group.items.length * 80}px` : '0px' }}>
              <div className="space-y-1 pt-0.5 pb-1">{group.items.map(item => renderMobileItem(item))}</div>
            </div>
            {idx < menuGroups.length - 1 && <div className="h-px bg-white/10 mt-3 mb-1" />}
          </div>
        ))}
      </div>
    );
  };

  /* ── render ─────────────────────────────────── */
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 lg:bg-[#EDF2F4]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="flex w-full h-screen overflow-hidden bg-[#EDF2F4] shadow-2xl lg:shadow-none relative">

        {/* ── DESKTOP SIDEBAR ─────────────────────── */}
        <aside className={`relative z-20 hidden lg:flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[1.5rem] overflow-hidden shrink-0 bg-[#941C2F]/80 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(148,28,47,0.25)] transition-[width] duration-300 ease-in-out ${collapsed ? 'w-[84px]' : 'w-[280px]'}`}>

          {/* header */}
          <div className={`pt-8 pb-6 border-b border-white/10 flex items-center shrink-0 transition-all duration-300 ${collapsed ? 'justify-center px-2' : 'justify-between px-7'}`}>
            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
              <Image src="/logo-sb.png" alt="Logo" width={160} height={36} className="h-9 w-auto object-contain drop-shadow-md" style={{ width: 'auto' }} />
            </div>
            <button onClick={() => setCollapsed(v => !v)}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/15 active:scale-90 transition-all duration-200 shrink-0">
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>

          {/* nav */}
          <div className="flex-1 min-h-0 px-3 py-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {menuGroups.length > 0 ? renderDesktopNav() : (
              /* not logged in: simple 404 state */
              <div className={`flex flex-col items-center justify-center h-full gap-3 ${collapsed ? '' : 'px-4'}`}>
                {!collapsed && (
                  <>
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Error 404
                    </div>
                    <p className="text-white/50 text-xs text-center leading-relaxed">Halaman yang kamu tuju tidak tersedia.</p>
                  </>
                )}
                {collapsed && (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-bold font-mono">404</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* footer */}
          {user && (
            <div className="shrink-0 px-3 pb-6 pt-3 border-t border-white/10">
              <button onClick={handleLogout} title={collapsed ? 'Keluar' : undefined}
                className={`w-full flex items-center transition-all duration-300 group rounded-xl text-white/70 hover:text-white hover:bg-white/20 ${collapsed ? 'justify-center w-[46px] h-[46px] mx-auto' : 'justify-between px-4 py-3'}`}>
                <div className={`flex items-center ${collapsed ? '' : 'gap-3.5'}`}>
                  <div className={`shrink-0 flex items-center justify-center transition-all duration-300 ${collapsed ? '' : 'p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10'}`}>
                    <LogOut size={19} className="text-white/70 group-hover:text-white transition-colors" />
                  </div>
                  {!collapsed && <span className="font-bold text-sm tracking-wide">Keluar</span>}
                </div>
              </button>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ────────────────────────── */}
        <main className="relative flex-1 h-screen flex flex-col overflow-hidden">

          {/* canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />

          {/* grid wash */}
          <div className="absolute inset-0 pointer-events-none" style={{
            zIndex: 2,
            backgroundImage: 'linear-gradient(to right,rgba(12,12,13,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(12,12,13,0.03) 1px,transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,#000 30%,transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,#000 30%,transparent 80%)',
          }} />

          {/* content overlay — pointer-events-none so cursor events fall through to canvas */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6" style={{ zIndex: 3 }}>
            {/* spacer for the animation */}
            <div className="h-[clamp(180px,34vh,320px)] w-full" />

            <h1 className="text-[clamp(22px,3vw,40px)] font-extrabold text-slate-800 text-center leading-tight max-w-[18ch] mt-4">
              Halaman ini <span className="text-[#941C2F]">tidak tersedia</span>
            </h1>
            <p className="text-sm text-slate-500 text-center max-w-[44ch] leading-relaxed mt-3">
              Halaman yang kamu cari mungkin sudah dipindahkan, dihapus, atau URL-nya salah.
            </p>

            <div className="pointer-events-auto mt-6">
              <Link href={homeHref}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#941C2F] text-white text-sm font-bold shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1727] hover:-translate-y-px active:scale-95 transition-all duration-200">
                <Home size={15} strokeWidth={2.5} /> Dashboard
              </Link>
            </div>
          </div>

          {/* ── MOBILE NAVBAR ───────────────────── */}
          <header className="lg:hidden absolute top-0 left-0 right-0 flex items-center justify-between gap-3 px-6 py-3.5 z-20">
            <Link href={homeHref}
              className="shrink-0 text-[#941C2F] hover:scale-105 active:scale-90 rounded-full transition-all duration-200 p-2.5 flex items-center justify-center">
              <Home size={26} strokeWidth={2.5} />
            </Link>
            <div className="flex flex-col items-center rounded-xl px-3 py-1.5 bg-white/40 backdrop-blur-md shadow-sm border border-white/20">
              <p className="text-[8px] font-bold text-slate-500 tracking-widest uppercase leading-none">{dateStr}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-base font-black font-mono tracking-tight text-[#941C2F] leading-none">{timeStr}</p>
                <p className="text-[9px] font-extrabold text-slate-500 tracking-widest leading-none">WIB</p>
              </div>
            </div>
            <button onClick={() => setDrawerOpen(true)}
              className="shrink-0 text-[#941C2F] hover:scale-105 active:scale-90 rounded-full transition-all duration-200 p-2.5 flex items-center justify-center">
              <Menu size={28} strokeWidth={2.5} />
            </button>
          </header>

          {/* ── DESKTOP TOP-RIGHT ────────────────── */}
          <div className="hidden lg:flex flex-col absolute top-7 right-7 z-20 items-end gap-3">
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase leading-none drop-shadow-sm">{dateStr.split(', ')[0]}</p>
                <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-1 leading-none drop-shadow-sm">{dateStr.split(', ')[1]}</p>
              </div>
              <div className="w-0.5 h-10 bg-white/80" />
              <div>
                <p className="text-2xl font-black font-mono tracking-tight text-[#941C2F] leading-none drop-shadow-sm">{timeStr}</p>
                <p className="text-[10px] font-extrabold text-slate-500 tracking-widest text-right mt-1 drop-shadow-sm">WIB</p>
              </div>
            </div>
            <div className="flex gap-2">
              {user?.id_koordinator && user?.id_asisten ? (
                <>
                  <Link href="/koordinator"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md text-[#941C2F] bg-white/80 border-white/50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-bold">
                    <Home size={16} strokeWidth={2.5} /> Dash Koor
                  </Link>
                  <Link href="/asdos"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md text-[#941C2F] bg-white/80 border-white/50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-bold">
                    <Home size={16} strokeWidth={2.5} /> Dash Asdos
                  </Link>
                </>
              ) : (
                <Link href={homeHref}
                  className="flex items-center gap-2 px-4 py-2.5 text-[#941C2F] bg-white/80 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 rounded-2xl transition-all duration-300 text-sm font-bold">
                  <Home size={17} strokeWidth={2.5} /> Dashboard
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── MOBILE SIDEBAR DRAWER ─────────────────── */}
      <div className={`lg:hidden fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}>
        <div onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 left-0 w-[280px] h-[calc(100dvh-1.5rem)] my-3 ml-3 rounded-[1.5rem] bg-[#941C2F]/85 backdrop-blur-2xl border border-white/20 shadow-[20px_0_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}>
          <div className="pt-8 pb-6 px-6 border-b border-white/10 shrink-0">
            <Image src="/logo-sb.png" alt="Logo" width={160} height={32} className="h-8 w-auto object-contain drop-shadow-md" style={{ width: 'auto' }} />
          </div>
          <div className="flex-1 min-h-0 px-3 py-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {menuGroups.length > 0 ? renderMobileNav() : (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Error 404
                </div>
                <p className="text-white/50 text-xs text-center leading-relaxed">Halaman yang kamu tuju tidak tersedia.</p>
              </div>
            )}
          </div>
          {user && (
            <div className="shrink-0 px-3 pt-3 border-t border-white/10" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
              <button onClick={() => { setDrawerOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                    <LogOut size={18} className="text-white/70 group-hover:text-white transition-colors" />
                  </div>
                  <span className="font-semibold text-sm tracking-wide">Keluar</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
