import { Canvas } from '@react-three/fiber'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import './App.css'
import { SceneController } from './components/Mycelium/SceneController'
import { Node } from './components/Mycelium/Node'
import { FlowingLine } from './components/Mycelium/FlowingConnection'
import { generateMycelium } from './data/generateMycelium'
import { useStore } from './store/useStore'
import { CardDisplay } from './components/CardDisplay'
import { startAudio } from './audio/synth'
import { Hero } from './components/Hero'

const SCENE_AUDIO_URL = 'https://amazons3-images-micel10.s3.us-east-2.amazonaws.com/sounds/creature.mp3'

export default function App() {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [maxNodes, setMaxNodes] = useState(25);
  const [audioReady, setAudioReady] = useState(false);
  const [isFogBlowing, setIsFogBlowing] = useState(false);
  const [sceneAudioPlaying, setSceneAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) return;
    const handleCanPlay = () => console.log('Scene audio loaded', player.currentSrc);
    const handlePlay = () => console.log('Scene audio play event', player.currentSrc);
    const handleError = () => {
      const mediaError = player.error;
      console.error('Scene audio error', {
        code: mediaError?.code,
        message: mediaError?.message,
        currentSrc: player.currentSrc,
        networkState: player.networkState,
        readyState: player.readyState,
      });
    };
    player.addEventListener('canplaythrough', handleCanPlay);
    player.addEventListener('play', handlePlay);
    player.addEventListener('error', handleError);
    return () => {
      player.removeEventListener('canplaythrough', handleCanPlay);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('error', handleError);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMaxNodes((m) => (m < 100 ? m + 3 : m));
    }, 600);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(() => generateMycelium(80, { maxNodes, seed }), [maxNodes, seed]);
  const selectedNode = useStore((state) => state.selectedNode);
  const sceneVersion = useStore((state) => state.sceneVersion);

  const handleArmAudio = async () => {
    if (!audioReady) {
      try {
        await startAudio();
        setAudioReady(true);
      } catch (err) {
        // ignore; browser may block until valid gesture
      }
    }
  };

  const startSceneAudio = useCallback(async (restart = false) => {
    const player = audioRef.current;
    if (!player) return;
    if (restart) {
      player.currentTime = 0;
    }
    console.log('Scene audio play requested', { restart, src: SCENE_AUDIO_URL });
    try {
      await player.play();
      setSceneAudioPlaying(true);
    } catch (err) {
      console.warn('Scene audio failed to play', err);
    }
  }, []);

  const pauseSceneAudio = useCallback(() => {
    const player = audioRef.current;
    if (!player) return;
    player.pause();
    console.log('Scene audio paused', player.currentSrc);
    setSceneAudioPlaying(false);
  }, []);

  const restartSceneExperience = useCallback(() => {
    setMaxNodes(25);
    void startSceneAudio(true);
  }, [startSceneAudio]);

  const scrollToScene = () => {
    const sceneNode = document.getElementById('scene')
    sceneNode?.scrollIntoView({ behavior: 'smooth' })
  }

  // Crear un mapa de colores de nodos para acceso rápido
  const nodeColorMap = useMemo(() => {
    const map = {};
    data.nodes.forEach(node => {
      map[node.id] = node.color;
    });
    return map;
  }, [data.nodes]);

  useEffect(() => {
    const handleScroll = () => setIsFogBlowing(window.scrollY > 60);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDescend = () => {
    handleArmAudio()
    scrollToScene()
    restartSceneExperience()
  }

  const handleEnableAudioButton = () => {
    handleArmAudio()
    restartSceneExperience()
  }

  return (
    <div
      className={`space-scene ${isFogBlowing ? 'space-scene--blowing' : ''}`}
      onPointerDown={handleArmAudio}
    >
      <Hero onDescend={handleDescend} />

      <div id="scene" className="scene-wrapper">
        <Canvas
          key={sceneVersion}
          camera={{ position: [20, 20, 20], fov: 45 }}
          dpr={[1, 2]}
          style={{
            pointerEvents: selectedNode ? 'none' : 'auto',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            transition: 'pointer-events 0.3s ease'
          }}
        >
          <color attach="background" args={['#020205']} />
          <fog attach="fog" args={['#020205', 10, 45]} />

          <ambientLight intensity={0.1} />

          {data.links.map((link, i) => (
            <FlowingLine
              key={`${link.startId}-${link.endId}`}
              start={link.start}
              end={link.end}
              startId={link.startId}
              endId={link.endId}
              connectionId={i}
              nodeColors={nodeColorMap}
            />
          ))}

          {data.nodes.map(node => (
            <Node
              key={node.id}
              data={node}
              links={data.links}
              allNodes={data.nodes}
              audioReady={audioReady}
              onArmAudio={handleArmAudio}
            />
          ))}

          <SceneController />

          <EffectComposer disableNormalPass>
            <Bloom
              luminanceThreshold={1}
              mipmapBlur
              intensity={1.5}
              radius={0.4}
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>

        <div className="scene__audio-controls">
          <button
            type="button"
            className="scene__audio-btn"
            onClick={pauseSceneAudio}
            disabled={!sceneAudioPlaying}
          >
            Pause
          </button>
          <button
            type="button"
            className="scene__audio-btn"
            onClick={restartSceneExperience}
          >
            Restart
          </button>
        </div>

        {selectedNode && <CardDisplay node={selectedNode} />}
      </div>

      <audio
        ref={audioRef}
        autoPlay={false}
        preload="auto"
        loop
        aria-hidden="true"
      >
        <source src={SCENE_AUDIO_URL} type="audio/mp3" />
        <source src={SCENE_AUDIO_URL} type="audio/mpeg" />
      </audio>

      {!audioReady && (
        <button
          onClick={handleEnableAudioButton}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1200,
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid #22d3ee55',
            borderRadius: '10px',
            padding: '10px 14px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
          }}
        >
          Enable audio
        </button>
      )}

      <footer className="site-footer">
        Hecho con <span aria-hidden="true"><a href="https://www.tiktok.com/@soy.emme">&hearts;</a></span> por <a href="https://instagram.com/soy.emm3" target="_blank" rel="noreferrer">Emme</a>
      </footer>
    </div>
  )
}