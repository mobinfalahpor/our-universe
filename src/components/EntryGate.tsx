import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { SceneCanvas } from './SceneCanvas';
import { isInfinityAnswer } from '../core/persianUtils';
import { audioEngine } from '../systems/audioEngine';

function PortalScene({ opening }: { opening: boolean }) {
  const gateGroup = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const portalCoreRef = useRef<THREE.Mesh>(null);
  const leftCloudsRef = useRef<THREE.Group>(null);
  const rightCloudsRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const progressRef = useRef(0);

  const cloudPositions = useMemo(() => {
    const arr: [number, number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      arr.push([
        side * (1.8 + (i % 4) * 1.4),
        -1.2 + Math.sin(i * 1.3) * 1.6,
        1.5 - (i % 3) * 1.2,
        0.8 + (i % 3) * 0.35,
      ]);
    }
    return arr;
  }, []);

  useFrame(({ camera, clock }, delta) => {
    const t = clock.getElapsedTime();

    if (opening) {
      progressRef.current = Math.min(1, progressRef.current + delta * 0.48);
    }
    const p = progressRef.current;
    const ease = p * p * (3 - 2 * p);

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * (0.25 + ease * 1.8);
      ring1Ref.current.scale.setScalar(1 + ease * 0.35);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * (0.18 + ease * 1.4);
      ring2Ref.current.scale.setScalar(1 + ease * 0.22);
    }
    if (portalCoreRef.current) {
      const mat = portalCoreRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.25 + ease * 0.72;
      mat.emissiveIntensity = 0.9 + ease * 3.5;
    }

    // Part the clouds when opening
    if (leftCloudsRef.current) {
      leftCloudsRef.current.position.x = THREE.MathUtils.lerp(0, -6.5, ease);
      leftCloudsRef.current.position.y = Math.sin(t * 0.4) * 0.12;
    }
    if (rightCloudsRef.current) {
      rightCloudsRef.current.position.x = THREE.MathUtils.lerp(0, 6.5, ease);
      rightCloudsRef.current.position.y = Math.cos(t * 0.35) * 0.12;
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = 2.5 + ease * 12;
    }

    // Fly camera through the glowing portal toward the island
    const targetZ = THREE.MathUtils.lerp(9.2, -3.5, ease);
    const targetY = THREE.MathUtils.lerp(1.4, 2.0, ease);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 4, delta);
    camera.position.x = Math.sin(t * 0.25) * 0.25 * (1 - ease);
    camera.lookAt(0, 1.8, -5);
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#7771A8" />
      <hemisphereLight args={['#D9A9C5', '#17172F', 0.65]} />
      <pointLight ref={keyLightRef} position={[0, 2.2, 1.5]} color="#D6B875" intensity={2.5} distance={18} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#F1DCCB" />

      <Stars
        radius={45}
        depth={35}
        count={opening ? 2600 : 1400}
        factor={opening ? 6 : 4}
        saturation={0.5}
        fade
        speed={opening ? 2.5 : 0.6}
      />

      <Sparkles
        count={opening ? 140 : 65}
        scale={[12, 8, 10]}
        size={opening ? 4.5 : 2.6}
        speed={opening ? 1.8 : 0.4}
        color="#D6B875"
      />

      {/* Glowing Archway Portal */}
      <group ref={gateGroup} position={[0, 0, -1]}>
        {/* Pedestal steps */}
        <mesh position={[0, -0.35, 0]} receiveShadow>
          <cylinderGeometry args={[3.4, 4.1, 0.5, 32]} />
          <meshStandardMaterial color="#252548" roughness={0.65} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[2.7, 3.1, 0.25, 32]} />
          <meshStandardMaterial color="#34335e" roughness={0.55} metalness={0.25} />
        </mesh>

        {/* Columns */}
        <mesh position={[-1.85, 1.9, 0]}>
          <cylinderGeometry args={[0.2, 0.26, 3.8, 18]} />
          <meshStandardMaterial color="#F1DCCB" roughness={0.45} metalness={0.15} />
        </mesh>
        <mesh position={[1.85, 1.9, 0]}>
          <cylinderGeometry args={[0.2, 0.26, 3.8, 18]} />
          <meshStandardMaterial color="#F1DCCB" roughness={0.45} metalness={0.15} />
        </mesh>

        {/* Golden Arch */}
        <mesh position={[0, 3.5, 0]}>
          <torusGeometry args={[1.85, 0.16, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.22} />
        </mesh>

        {/* Spinning celestial rings inside portal */}
        <mesh ref={ring1Ref} position={[0, 2.3, 0]}>
          <torusGeometry args={[1.55, 0.045, 12, 48]} />
          <meshStandardMaterial color="#D6B875" emissive="#D6B875" emissiveIntensity={1.2} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh ref={ring2Ref} position={[0, 2.3, -0.1]}>
          <torusGeometry args={[1.22, 0.035, 12, 48]} />
          <meshStandardMaterial color="#D9A9C5" emissive="#D9A9C5" emissiveIntensity={1.0} metalness={0.6} roughness={0.25} />
        </mesh>

        {/* Portal shimmer core */}
        <mesh ref={portalCoreRef} position={[0, 2.3, -0.15]}>
          <circleGeometry args={[1.48, 40]} />
          <meshStandardMaterial
            color="#D9A9C5"
            emissive="#D6B875"
            emissiveIntensity={0.9}
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Parting 3D Clouds */}
      <group ref={leftCloudsRef}>
        {cloudPositions
          .filter((c) => c[0] < 0)
          .map(([x, y, z, s], idx) => (
            <group key={idx} position={[x, y, z]} scale={s}>
              <mesh>
                <sphereGeometry args={[0.75, 16, 16]} />
                <meshStandardMaterial color="#F1DCCB" roughness={0.95} transparent opacity={0.88} />
              </mesh>
              <mesh position={[0.55, -0.15, 0.1]}>
                <sphereGeometry args={[0.55, 14, 14]} />
                <meshStandardMaterial color="#D9A9C5" roughness={0.95} transparent opacity={0.85} />
              </mesh>
            </group>
          ))}
      </group>
      <group ref={rightCloudsRef}>
        {cloudPositions
          .filter((c) => c[0] > 0)
          .map(([x, y, z, s], idx) => (
            <group key={idx} position={[x, y, z]} scale={s}>
              <mesh>
                <sphereGeometry args={[0.75, 16, 16]} />
                <meshStandardMaterial color="#F1DCCB" roughness={0.95} transparent opacity={0.88} />
              </mesh>
              <mesh position={[-0.55, -0.15, 0.1]}>
                <sphereGeometry args={[0.55, 14, 14]} />
                <meshStandardMaterial color="#7771A8" roughness={0.95} transparent opacity={0.85} />
              </mesh>
            </group>
          ))}
      </group>
    </>
  );
}

interface EntryGateProps {
  onSuccessEnter: () => void;
}

export const EntryGate: React.FC<EntryGateProps> = ({ onSuccessEnter }) => {
  const [answer, setAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [opening, setOpening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (opening) return;

    if (isInfinityAnswer(answer)) {
      setErrorMsg('');
      setOpening(true);
      audioEngine.playSfx('portal');
      window.setTimeout(() => {
        onSuccessEnter();
      }, 2100);
    } else {
      audioEngine.playSfx('click');
      setErrorMsg('پاسخ دقیقاً همین نیست! یک راهنمایی کوچک: عشق مبین هیچ پایانی ندارد...');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#17172F]">
      <SceneCanvas cameraPosition={[0, 1.4, 9.2]} fov={48} bgColor="#17172F" fogNear={14} fogFar={52}>
        <PortalScene opening={opening} />
      </SceneCanvas>

      <AnimatePresence>
        {!opening && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-0 z-10 flex items-center justify-center p-4 pointer-events-none"
          >
            <form
              onSubmit={handleSubmit}
              className="pointer-events-auto w-full max-w-md rounded-3xl bg-[#17172F]/82 border border-[#D6B875]/35 shadow-2xl p-6 sm:p-8 text-center"
            >
              <p className="text-xs tracking-wide text-[#D6B875] mb-2 font-medium">
                دروازه اختصاصی زهرا
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F1DCCB] mb-3">
                جهان کوچولوی ما
              </h1>
              <p className="text-sm sm:text-base text-[#D9A9C5] leading-relaxed mb-7">
                یک دنیای کوچک، فقط برای تو ساخته شده...
              </p>

              <div className="text-right mb-5">
                <label
                  htmlFor="love-answer"
                  className="block text-sm font-medium text-[#F1DCCB] mb-2.5"
                >
                  مبین چقدر دوستت داره؟
                </label>
                <input
                  id="love-answer"
                  type="text"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="پاسخ را اینجا بنویس..."
                  autoFocus
                  className="w-full rounded-2xl bg-[#222244]/90 border border-[#7771A8]/50 focus:border-[#D6B875] outline-none px-4 py-3.5 text-[#F1DCCB] placeholder-[#7771A8] text-center text-base transition-colors"
                />
              </div>

              {errorMsg && (
                <p className="text-xs sm:text-sm text-[#D9A9C5] bg-[#D9A9C5]/10 border border-[#D9A9C5]/25 rounded-xl py-2.5 px-3 mb-4 leading-relaxed">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-l from-[#D6B875] via-[#D9A9C5] to-[#7771A8] text-[#17172F] font-bold text-base shadow-lg hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                ورود به جهان ما ✨
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {opening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-0 bottom-12 z-20 text-center pointer-events-none px-4"
        >
          <p className="text-lg sm:text-xl font-semibold text-[#F1DCCB]">
            دروازه ستاره‌ها به روی تو باز شد...
          </p>
        </motion.div>
      )}
    </div>
  );
};
