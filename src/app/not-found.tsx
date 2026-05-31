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

interface MenuItem { id: number; title: string; icon: React.ElementType; href: string }
interface MenuGroup { id: string; title: string; items: MenuItem[] }

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
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
        if (any) { mouse.down = true; canvas!.style.cursor = 'grabbing'; try { canvas!.setPointerCapture(e.pointerId); } catch {} }
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
  }, [canvasRef]);
}

function useCubeCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;
    let cleanupFn: (() => void) | undefined;

    async function init() {
      const THREE = await import('three');
      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 21.0);

      const cube = new THREE.Group();
      scene.add(cube);

      const SIDE = 2.4;
      const HALF = SIDE / 2;
      const SAMPLE_RES = 256;
      const DOT_STEP = 7;
      const sampler = document.createElement('canvas');
      sampler.width = sampler.height = SAMPLE_RES;
      const sctx = sampler.getContext('2d');
      if (!sctx) return;

      function sampleLetter(ch: string) {
        sctx!.fillStyle = '#fff';
        sctx!.fillRect(0, 0, SAMPLE_RES, SAMPLE_RES);
        sctx!.fillStyle = '#000';
        const isWord = ch.length > 1;
        const fontPx = isWord ? Math.round(SAMPLE_RES * 0.22) : Math.round(SAMPLE_RES * 0.78);
        sctx!.font = `900 ${fontPx}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        sctx!.textAlign = 'center';
        sctx!.textBaseline = 'middle';
        sctx!.fillText(ch, SAMPLE_RES / 2, SAMPLE_RES / 2 + SAMPLE_RES * 0.02);

        const img = sctx!.getImageData(0, 0, SAMPLE_RES, SAMPLE_RES).data;
        const pts: { u: number; v: number }[] = [];
        for (let y = 0; y < SAMPLE_RES; y += DOT_STEP) {
          for (let x = 0; x < SAMPLE_RES; x += DOT_STEP) {
            const i = (y * SAMPLE_RES + x) * 4;
            if (img[i] >= 128) {
              const jx = (Math.random() - 0.5) * 0.4;
              const jy = (Math.random() - 0.5) * 0.4;
              pts.push({
                u: (x + jx) / SAMPLE_RES - 0.5,
                v: -((y + jy) / SAMPLE_RES - 0.5),
              });
            }
          }
        }
        return pts;
      }

      const faces = [
        { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0), normal: new THREE.Vector3(0, 0, 1), content: 'A' },
        { right: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0), normal: new THREE.Vector3(1, 0, 0), content: 'L' },
        { right: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0), normal: new THREE.Vector3(0, 0, -1), content: 'T' },
        { right: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0), normal: new THREE.Vector3(-1, 0, 0), content: 'A' },
        { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(0, 1, 0), content: 'R' },
        { right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(0, -1, 0), content: 'ALTAR' },
      ];

      const positionsArr: number[] = [];
      const normalsArr: number[] = [];
      const seedsArr: number[] = [];
      const phaseAxisArr: number[] = [];
      const letterArr: number[] = [];

      for (let fi = 0; fi < faces.length; fi++) {
        const f = faces[fi];
        const pts = sampleLetter(f.content);
        const scale = SIDE * 0.92;
        for (const p of pts) {
          const x = f.right.x * p.u * scale + f.up.x * p.v * scale + f.normal.x * HALF;
          const y = f.right.y * p.u * scale + f.up.y * p.v * scale + f.normal.y * HALF;
          const z = f.right.z * p.u * scale + f.up.z * p.v * scale + f.normal.z * HALF;
          positionsArr.push(x, y, z);
          normalsArr.push(f.normal.x, f.normal.y, f.normal.z);
          seedsArr.push(Math.random());
          phaseAxisArr.push(p.u + 0.5);
          letterArr.push(fi);
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionsArr), 3));
      geom.setAttribute('aNormal', new THREE.BufferAttribute(new Float32Array(normalsArr), 3));
      geom.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(seedsArr), 1));
      geom.setAttribute('aAxis', new THREE.BufferAttribute(new Float32Array(phaseAxisArr), 1));
      geom.setAttribute('aLetter', new THREE.BufferAttribute(new Float32Array(letterArr), 1));

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: renderer.getPixelRatio() },
          uSize: { value: 1.6 },
          uColor: { value: new THREE.Color(0x0c0c0d) },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPixelRatio;
          uniform float uSize;
          attribute vec3 aNormal;
          attribute float aSeed;
          attribute float aLetter;
          varying float vAlpha;

          void main(){
            float a = mix(0.78, 1.0, aSeed);
            vec3 wN = normalize((modelMatrix * vec4(aNormal, 0.0)).xyz);
            vec3 toCam = normalize(cameraPosition - (modelMatrix * vec4(position,1.0)).xyz);
            float facing = clamp(dot(wN, toCam), -1.0, 1.0);
            float backFade = smoothstep(-0.05, 0.40, facing);
            vAlpha = a * backFade;
            vec3 pos = position;
            float bob = sin(uTime * 0.65 + aLetter * 1.9) * 0.012;
            pos += aNormal * bob;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = uSize * uPixelRatio * (28.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform vec3 uColor;
          varying float vAlpha;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float disk = smoothstep(0.5, 0.38, d);
            if (disk * vAlpha <= 0.01) discard;
            gl_FragColor = vec4(uColor, disk * vAlpha);
          }
        `,
      });

      const points = new THREE.Points(geom, mat);
      cube.add(points);

      const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(SIDE, SIDE, SIDE));
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0c0c0d, transparent: true, opacity: 0.08 });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      cube.add(edges);

      function resize() {
        const rect = canvas!.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.position.z = h > w ? 21.0 : 6.4;
        cube.position.y = h > w ? 1.1 : 0.0;
        camera.updateProjectionMatrix();
        mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      }

      const initialRotX = -0.95;
      const initialRotY = 0.10;
      const rot = { x: initialRotX, y: initialRotY };
      const target = { x: initialRotX, y: initialRotY };
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let userHasInteracted = true;
      let lastInteract = performance.now() - 2000;

      
      const gyro = { x: 0, y: 0 };
      let initialBeta: number | null = null;
      let initialGamma: number | null = null;

      function onDeviceOrientation(e: DeviceOrientationEvent) {
        if (dragging) return;
        const beta = e.beta;  
        const gamma = e.gamma; 
        if (beta === null || gamma === null) return;

        
        if (initialBeta === null || initialGamma === null) {
          initialBeta = beta;
          initialGamma = gamma;
          return;
        }

        const deltaBeta = beta - initialBeta;
        const deltaGamma = gamma - initialGamma;

        
        gyro.x = Math.max(-0.6, Math.min(0.6, deltaBeta * 0.012));
        gyro.y = Math.max(-0.6, Math.min(0.6, deltaGamma * 0.012));
      }

      
      if (
        typeof window !== 'undefined' &&
        
        !(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')
      ) {
        window.addEventListener('deviceorientation', onDeviceOrientation);
      }

      function onPointerDown(e: PointerEvent) {
        dragging = true;
        userHasInteracted = true;
        lastX = e.clientX;
        lastY = e.clientY;
        try { canvas!.setPointerCapture(e.pointerId); } catch {}

        
        if (
          typeof DeviceOrientationEvent !== 'undefined' &&
          
          typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
          
          DeviceOrientationEvent.requestPermission()
            .then((state: string) => {
              if (state === 'granted') {
                window.addEventListener('deviceorientation', onDeviceOrientation);
              }
            })
            .catch(console.error);
        }
      }

      function onPointerMove(e: PointerEvent) {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        target.y += dx * 0.01;
        target.x += dy * 0.01;
        target.x = Math.max(-1.4, Math.min(1.4, target.x));
        lastInteract = performance.now();
      }

      function endDrag() {
        dragging = false;
        lastInteract = performance.now();
      }

      const clock = new THREE.Clock();
      function tick() {
        const t = clock.getElapsedTime();
        mat.uniforms.uTime.value = t;
        const sinceMove = (performance.now() - lastInteract) / 1000;
        const autoFactor = Math.min(1, Math.max(0, (sinceMove - 0.3) / 1.5));
        if (!dragging && userHasInteracted) target.y += 0.0035 * autoFactor;
        
        
        rot.x += (target.x + gyro.x - rot.x) * 0.08;
        rot.y += (target.y + gyro.y - rot.y) * 0.08;
        cube.rotation.x = rot.x;
        cube.rotation.y = rot.y;
        
        renderer.render(scene, camera);
        animId = requestAnimationFrame(tick);
      }

      const onResize = () => requestAnimationFrame(resize);
      window.addEventListener('resize', onResize);
      canvas!.addEventListener('pointerdown', onPointerDown);
      canvas!.addEventListener('pointermove', onPointerMove);
      canvas!.addEventListener('pointerup', endDrag);
      canvas!.addEventListener('pointercancel', endDrag);

      resize();
      tick();

      cleanupFn = () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('deviceorientation', onDeviceOrientation);
        canvas!.removeEventListener('pointerdown', onPointerDown);
        canvas!.removeEventListener('pointermove', onPointerMove);
        canvas!.removeEventListener('pointerup', endDrag);
        canvas!.removeEventListener('pointercancel', endDrag);
        cancelAnimationFrame(animId);
        renderer.dispose();
        geom.dispose();
        mat.dispose();
        edgeGeometry.dispose();
        edgeMaterial.dispose();
      };
    }

    init();
    return () => cleanupFn?.();
  }, [canvasRef]);
}
function NotFoundGuest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubeCanvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);
  useCubeCanvas(cubeCanvasRef);

  const gridStyle: React.CSSProperties = {
    zIndex: 2,
    backgroundImage: 'linear-gradient(to right,rgba(12,12,13,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(12,12,13,0.03) 1px,transparent 1px)',
    backgroundSize: '56px 56px',
    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,#000 30%,transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,#000 30%,transparent 80%)',
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden bg-canvas"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <canvas ref={cubeCanvasRef} className="absolute inset-0 w-full h-full lg:hidden touch-none" style={{ zIndex: 1 }} />
      <canvas ref={canvasRef} className="absolute inset-0 hidden w-full h-full lg:block" style={{ zIndex: 1 }} />
      <div className="absolute inset-0 pointer-events-none" style={gridStyle} />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6" style={{ zIndex: 3 }}>
        <div className="h-[clamp(180px,34vh,320px)] lg:h-[clamp(240px,52vh,420px)] w-full" />

        <h1 className="text-[clamp(22px,3vw,40px)] font-extrabold text-slate-800 text-center leading-tight max-w-[18ch] mt-4">
          Halaman ini <span className="text-crimson">tidak tersedia</span>
        </h1>
        <p className="text-sm text-slate-500 text-center max-w-[44ch] leading-relaxed mt-3">
          Halaman yang kamu cari mungkin sudah dipindahkan, dihapus, atau URL-nya salah.
        </p>

        <div className="pointer-events-auto mt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-crimson text-white text-sm font-bold shadow-md shadow-crimson/20 hover:bg-[#7a1727] hover:-translate-y-px active:scale-95 transition-all duration-200"
          >
            <ChevronRight size={15} strokeWidth={2.5} /> Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
function NotFoundAuth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubeCanvasRef = useRef<HTMLCanvasElement>(null);
  useParticleCanvas(canvasRef);
  useCubeCanvas(cubeCanvasRef);

  const router   = useRouter();
  const pathname = usePathname();
  const { user, clearUser } = useUserStore();

  const [collapsed,   setCollapsed]   = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [openGroups,  setOpenGroups]  = useState<Set<string>>(new Set(['koordinator', 'asdos']));
  const [timeStr,     setTimeStr]     = useState('');
  const [dateStr,     setDateStr]     = useState('');

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

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const menuGroups: MenuGroup[] = useMemo(() => {
    const groups: MenuGroup[] = [];
    if (user?.id_koordinator) groups.push({ id: 'koordinator', title: 'Koordinator', items: koordinatorMenuItems });
    if (user?.id_asisten)     groups.push({ id: 'asdos',       title: 'Asisten Dosen',       items: asdosMenuItems });
    return groups;
  }, [user]);

  const homeHref    = user?.id_koordinator ? '/koordinator' : user?.id_asisten ? '/asdos' : '/';
  const isMultiGroup = menuGroups.length > 1;
  const allItems    = menuGroups.flatMap(g => g.items);
  const isActive    = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const toggleGroup = (id: string) =>
    setOpenGroups(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleLogout = async () => {
    await logoutUser(); clearUser(); router.replace('/auth/login');
  };

  const sidebarBg  = 'bg-crimson border-[#7a1727] shadow-[0_8px_32px_rgba(148,28,47,0.25)]';
  const drawerBg   = 'bg-crimson/85';
  const headingCls = 'text-slate-800';
  const subCls     = 'text-slate-500';
  const clockPillCls  = 'bg-white/40 border-white/20';
  const clockDateCls  = 'text-slate-500';
  const clockTimeCls  = 'text-crimson';
  const sepLineCls    = 'bg-white/80';
  const dashBtnCls    = 'text-crimson bg-white/80 border-white/50 hover:bg-white/95';
  const mobileIconCls = 'text-crimson';

  const gridStyle: React.CSSProperties = {
    zIndex: 2,
    backgroundImage: 'linear-gradient(to right,rgba(12,12,13,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(12,12,13,0.03) 1px,transparent 1px)',
    backgroundSize: '56px 56px',
    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,#000 30%,transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%,#000 30%,transparent 80%)',
  };

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

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-canvas)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div
        className="flex w-full h-screen overflow-hidden shadow-2xl lg:shadow-none relative"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >


        <aside className={`relative z-20 hidden lg:flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[1.5rem] overflow-hidden shrink-0 border transition-[width,background-color] duration-300 ease-in-out ${sidebarBg} ${collapsed ? 'w-[84px]' : 'w-[280px]'}`}>


          <div className={`pt-8 pb-6 border-b border-white/10 flex items-center shrink-0 transition-all duration-300 ${collapsed ? 'justify-center px-2' : 'justify-between px-7'}`}>
            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
              <Image src="/logo-sb.png" alt="Logo" width={160} height={36} className="h-9 w-auto object-contain drop-shadow-md" style={{ width: 'auto' }} />
            </div>
            <button onClick={() => setCollapsed(v => !v)}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/15 active:scale-90 transition-all duration-200 shrink-0">
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>


          <div className="flex-1 min-h-0 px-3 py-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {menuGroups.length > 0 ? renderDesktopNav() : (
              <div className={`flex flex-col items-center justify-center h-full gap-3 ${collapsed ? '' : 'px-4'}`}>
                {!collapsed && (
                  <p className="text-white/50 text-xs text-center leading-relaxed">Halaman yang kamu tuju tidak tersedia.</p>
                )}
                {collapsed && (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-bold font-mono">404</span>
                  </div>
                )}
              </div>
            )}
          </div>


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

        <main className="relative flex-1 h-screen flex flex-col overflow-hidden">


          <canvas ref={cubeCanvasRef} className="absolute inset-0 w-full h-full lg:hidden touch-none" style={{ zIndex: 1 }} />
          <canvas ref={canvasRef} className="absolute inset-0 hidden w-full h-full lg:block" style={{ zIndex: 1 }} />

          <div className="absolute inset-0 pointer-events-none" style={gridStyle} />


          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6" style={{ zIndex: 3 }}>
            <div className="h-[clamp(180px,34vh,320px)] lg:h-[clamp(240px,52vh,420px)] w-full" />

            <h1 className={`text-[clamp(22px,3vw,40px)] font-extrabold text-center leading-tight max-w-[18ch] mt-4 ${headingCls}`}>
              Halaman ini <span className="text-crimson">tidak tersedia</span>
            </h1>
            <p className={`text-sm text-center max-w-[44ch] leading-relaxed mt-3 ${subCls}`}>
              Halaman yang kamu cari mungkin sudah dipindahkan, dihapus, atau URL-nya salah.
            </p>

            <div className="pointer-events-auto mt-6">
              <Link href={homeHref}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-crimson text-white text-sm font-bold shadow-md shadow-crimson/20 hover:bg-[#7a1727] hover:-translate-y-px active:scale-95 transition-all duration-200">
                Dashboard
              </Link>
            </div>
          </div>

          <header className="lg:hidden absolute top-0 left-0 right-0 flex items-center justify-between gap-3 px-6 py-3.5 z-20">
            <Link href={homeHref}
              className={`shrink-0 hover:scale-105 active:scale-90 rounded-full transition-all duration-200 p-2.5 flex items-center justify-center ${mobileIconCls}`}>
              <Home size={26} strokeWidth={2.5} />
            </Link>

            <div className={`flex flex-col items-center rounded-xl px-3 py-1.5 backdrop-blur-md shadow-sm border ${clockPillCls}`}>
              <p className={`text-[8px] font-bold tracking-widest uppercase leading-none ${clockDateCls}`}>{dateStr}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className={`text-base font-black font-mono tracking-tight leading-none ${clockTimeCls}`}>{timeStr}</p>
                <p className={`text-[9px] font-extrabold tracking-widest leading-none ${clockDateCls}`}>WIB</p>
              </div>
            </div>

            <button onClick={() => setDrawerOpen(true)}
              className={`shrink-0 hover:scale-105 active:scale-90 rounded-full transition-all duration-200 p-2.5 flex items-center justify-center ${mobileIconCls}`}>
              <Menu size={28} strokeWidth={2.5} />
            </button>
          </header>

          
          <div className="hidden lg:flex absolute top-7 right-7 z-20 flex-col items-end gap-3">
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className={`text-[11px] font-bold tracking-widest uppercase leading-none drop-shadow-sm ${clockDateCls}`}>{dateStr.split(', ')[0]}</p>
                <p className={`text-[11px] font-bold tracking-widest uppercase mt-1 leading-none drop-shadow-sm ${clockDateCls}`}>{dateStr.split(', ')[1]}</p>
              </div>
              <div className={`w-0.5 h-10 ${sepLineCls}`} />
              <div>
                <p className={`text-2xl font-black font-mono tracking-tight leading-none drop-shadow-sm ${clockTimeCls}`}>{timeStr}</p>
                <p className={`text-[10px] font-extrabold tracking-widest text-right mt-1 drop-shadow-sm ${clockDateCls}`}>WIB</p>
              </div>
            </div>
          </div>

          
          <div className="hidden lg:flex absolute top-7 left-7 z-20 gap-2">
            {user?.id_koordinator && user?.id_asisten ? (
              <>
                <Link href="/koordinator"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-bold ${dashBtnCls}`}>
                  <Home size={16} strokeWidth={2.5} /> Dashboard Koordinator
                </Link>
                <Link href="/asdos"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 text-sm font-bold ${dashBtnCls}`}>
                  <Home size={16} strokeWidth={2.5} /> Dashboard Asisten Dosen
                </Link>
              </>
            ) : (
              <Link href={homeHref}
                className={`flex items-center gap-2 px-4 py-2.5 backdrop-blur-md border shadow-sm hover:shadow-md hover:scale-105 active:scale-95 rounded-2xl transition-all duration-300 text-sm font-bold ${dashBtnCls}`}>
                <Home size={17} strokeWidth={2.5} /> Dashboard
              </Link>
            )}
          </div>
        </main>
      </div>

      <div className={`lg:hidden fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}>
        <div onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 left-0 w-[280px] h-[calc(100dvh-1.5rem)] my-3 ml-3 rounded-[1.5rem] backdrop-blur-2xl border border-white/20 shadow-[20px_0_40px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${drawerBg} ${drawerOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}>
          <div className="pt-8 pb-6 px-6 border-b border-white/10 shrink-0">
            <Image src="/logo-sb.png" alt="Logo" width={160} height={32} className="h-8 w-auto object-contain drop-shadow-md" style={{ width: 'auto' }} />
          </div>
          <div className="flex-1 min-h-0 px-3 py-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {menuGroups.length > 0 ? renderMobileNav() : (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
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

export default function NotFound() {
  const { user } = useUserStore();

  if (!user) return <NotFoundGuest />;
  return <NotFoundAuth />;
}

