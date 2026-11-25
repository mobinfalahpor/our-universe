import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CatAccessory, CatBreed, CatEmotion, CatStage } from '../core/types';
import { DEFAULT_ORANGE_CAT_COLOR, loadCatGltf } from '../systems/catGlbBuilder';
import { disposeObject3D } from '../core/dispose';

// اگر بخواهید به‌صورت دستی رنگ خز گربه را عوض کنید، مقدار DEFAULT_ORANGE_CAT_COLOR
// در فایل src/systems/catGlbBuilder.ts را تغییر دهید یا از بخش «رنگ دلخواه» در UI استفاده کنید.
export { DEFAULT_ORANGE_CAT_COLOR };

export type CatAnimationName =
  | 'Idle'
  | 'Walk'
  | 'Run'
  | 'Sit'
  | 'Sleep'
  | 'Stretch'
  | 'Yawn'
  | 'LickPaw'
  | 'Groom'
  | 'Play'
  | 'Eat'
  | 'Drink'
  | 'Bath'
  | 'Happy';

interface CatRigRefs {
  bodyPivot?: THREE.Object3D;
  headLookPivot?: THREE.Object3D;
  earL?: THREE.Object3D;
  earR?: THREE.Object3D;
  upperLidL?: THREE.Object3D;
  upperLidR?: THREE.Object3D;
  lowerLidL?: THREE.Object3D;
  lowerLidR?: THREE.Object3D;
  pupilL?: THREE.Object3D;
  pupilR?: THREE.Object3D;
  tailTipPivot?: THREE.Object3D;
}

interface CatActor3DProps {
  breed: CatBreed;
  customFurColor?: string;
  accessory: CatAccessory;
  stage: CatStage;
  animation: CatAnimationName;
  emotion?: CatEmotion;
  position?: [number, number, number];
  rotationY?: number;
  lookAtUser?: boolean;
  lookTarget?: [number, number, number] | null;
  isPetting?: boolean;
  earPerked?: boolean;
  customGlbBuffer?: ArrayBuffer;
  onClick?: () => void;
  onHeadClick?: () => void;
  onBodyClick?: () => void;
  onFootstep?: () => void;
}

const _worldPos = new THREE.Vector3();
const _targetVec = new THREE.Vector3();

export const CatActor3D: React.FC<CatActor3DProps> = ({
  breed,
  customFurColor,
  accessory,
  stage,
  animation,
  emotion = 'happy',
  position = [0, 0, 0],
  rotationY = 0,
  lookAtUser = false,
  lookTarget = null,
  isPetting = false,
  earPerked = false,
  customGlbBuffer,
  onClick,
  onHeadClick,
  onBodyClick,
  onFootstep,
}) => {
  const { camera } = useThree();
  const containerRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const rigRef = useRef<CatRigRefs>({});
  const [loadedScene, setLoadedScene] = useState<THREE.Object3D | null>(null);

  // Blinking & step phase state
  const blinkTimerRef = useRef(2.4);
  const blinkAmountRef = useRef(0);
  const doubleBlinkRef = useRef(false);
  const stepAccumRef = useRef(0);

  const stageScale = useMemo(() => {
    if (stage === 'kitten') return 0.78;
    if (stage === 'young') return 0.96;
    return 1.12;
  }, [stage]);

  useEffect(() => {
    let active = true;
    let sceneObj: THREE.Object3D | null = null;

    loadCatGltf(breed, customGlbBuffer, customFurColor).then((gltf) => {
      if (!active) {
        disposeObject3D(gltf.scene);
        return;
      }
      sceneObj = gltf.scene;
      const upgradedMats = new Map<THREE.Material, THREE.Material>();

      sceneObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (!mat) return;

          const existing = upgradedMats.get(mat);
          if (existing) {
            mesh.material = existing;
            return;
          }

          if (mat.name === 'CatFurMat' || mat.name === 'CatHeadMat' || mat.name === 'CatBellyMat') {
            const phys = new THREE.MeshPhysicalMaterial({
              name: mat.name,
              color: mat.color.clone(),
              map: mat.map,
              normalMap: mat.normalMap,
              normalScale: mat.normalScale.clone(),
              roughnessMap: mat.roughnessMap,
              roughness: mat.roughness,
              metalness: mat.metalness,
              sheen: 0.22,
              sheenRoughness: 0.65,
              sheenColor: new THREE.Color(mat.name === 'CatBellyMat' ? '#fff4e3' : '#ff9c3b'),
            });
            upgradedMats.set(mat, phys);
            mesh.material = phys;
          } else if (mesh.name.startsWith('EyeCornea')) {
            const corneaPhys = new THREE.MeshPhysicalMaterial({
              name: mat.name,
              color: '#ffffff',
              roughness: 0.03,
              metalness: 0.02,
              clearcoat: 1.0,
              clearcoatRoughness: 0.04,
              transparent: true,
              opacity: 0.16,
              depthWrite: false,
            });
            upgradedMats.set(mat, corneaPhys);
            mesh.material = corneaPhys;
          }
        }
      });

      upgradedMats.forEach((_val, oldMat) => {
        oldMat.dispose();
      });

      // Cache expressive rig bones
      rigRef.current = {
        bodyPivot: sceneObj.getObjectByName('BodyPivot'),
        headLookPivot: sceneObj.getObjectByName('HeadLookPivot'),
        earL: sceneObj.getObjectByName('EarL'),
        earR: sceneObj.getObjectByName('EarR'),
        upperLidL: sceneObj.getObjectByName('UpperLidL'),
        upperLidR: sceneObj.getObjectByName('UpperLidR'),
        lowerLidL: sceneObj.getObjectByName('LowerLidL'),
        lowerLidR: sceneObj.getObjectByName('LowerLidR'),
        pupilL: sceneObj.getObjectByName('PupilL'),
        pupilR: sceneObj.getObjectByName('PupilR'),
        tailTipPivot: sceneObj.getObjectByName('TailTipPivot'),
      };

      const mixer = new THREE.AnimationMixer(sceneObj);
      const map: Record<string, THREE.AnimationAction> = {};
      for (const clip of gltf.animations) {
        map[clip.name] = mixer.clipAction(clip);
      }

      mixerRef.current = mixer;
      actionsRef.current = map;

      const startAction = map[animation] || map['Idle'] || Object.values(map)[0];
      if (startAction) {
        startAction.reset().play();
        currentActionRef.current = startAction;
      }

      setLoadedScene(sceneObj);
    });

    return () => {
      active = false;
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      actionsRef.current = {};
      currentActionRef.current = null;
      rigRef.current = {};
      if (sceneObj) disposeObject3D(sceneObj);
      setLoadedScene(null);
    };
  }, [breed, customFurColor, customGlbBuffer]);

  useEffect(() => {
    const map = actionsRef.current;
    const nextAction = map[animation] || map['Idle'];
    if (!nextAction) return;
    if (currentActionRef.current === nextAction) return;

    const prev = currentActionRef.current;
    nextAction.reset().fadeIn(0.35).play();
    if (prev) {
      prev.crossFadeTo(nextAction, 0.35, true);
    }
    currentActionRef.current = nextAction;
  }, [animation, loadedScene]);

  useEffect(() => {
    if (!loadedScene) return;
    const mount = loadedScene.getObjectByName('AccessoryMount');
    if (!mount) return;

    while (mount.children.length > 0) {
      const ch = mount.children[0];
      mount.remove(ch);
      disposeObject3D(ch);
    }

    if (accessory === 'none') return;

    const accGroup = new THREE.Group();
    if (accessory === 'rose_bow') {
      const mat = new THREE.MeshStandardMaterial({ color: '#D9A9C5', roughness: 0.45 });
      const left = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.08, 10), mat);
      left.rotation.z = -Math.PI / 2;
      left.position.set(-0.045, 0.16, 0.06);
      const right = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.08, 10), mat);
      right.rotation.z = Math.PI / 2;
      right.position.set(0.045, 0.16, 0.06);
      const knot = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#D6B875', roughness: 0.3 })
      );
      knot.position.set(0, 0.16, 0.065);
      accGroup.add(left, right, knot);
    } else if (accessory === 'gold_crown') {
      const goldMat = new THREE.MeshStandardMaterial({ color: '#D6B875', metalness: 0.85, roughness: 0.2 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.04, 16), goldMat);
      base.position.set(0, 0.205, 0);
      accGroup.add(base);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 8), goldMat);
        spike.position.set(Math.cos(a) * 0.075, 0.245, Math.sin(a) * 0.075);
        accGroup.add(spike);
      }
    } else if (accessory === 'lavender_scarf') {
      const scarfMat = new THREE.MeshStandardMaterial({ color: '#7771A8', roughness: 0.75 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.036, 10, 20), scarfMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -0.14, -0.02);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.14, 0.025), scarfMat);
      tail.position.set(0.085, -0.21, 0.09);
      tail.rotation.z = -0.25;
      accGroup.add(ring, tail);
    } else if (accessory === 'round_glasses') {
      const frameMat = new THREE.MeshStandardMaterial({ color: '#D6B875', metalness: 0.8, roughness: 0.25 });
      const lensMat = new THREE.MeshPhysicalMaterial({ color: '#F1DCCB', transparent: true, opacity: 0.25, roughness: 0.08 });
      const gL = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 20), frameMat);
      gL.position.set(0.086, 0.022, 0.205);
      const gR = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 20), frameMat);
      gR.position.set(-0.086, 0.022, 0.205);
      const lL = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), lensMat);
      lL.position.copy(gL.position);
      const lR = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), lensMat);
      lR.position.copy(gR.position);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.008), frameMat);
      bridge.position.set(0, 0.024, 0.205);
      accGroup.add(gL, gR, lL, lR, bridge);
    } else if (accessory === 'bell_collar') {
      const collarMat = new THREE.MeshStandardMaterial({ color: '#D9A9C5', roughness: 0.5 });
      const bellMat = new THREE.MeshStandardMaterial({ color: '#D6B875', metalness: 0.9, roughness: 0.18 });
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.022, 10, 20), collarMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, -0.14, -0.02);
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 12), bellMat);
      bell.position.set(0, -0.165, 0.13);
      accGroup.add(collar, bell);
    }

    mount.add(accGroup);
  }, [accessory, loadedScene]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();
    mixerRef.current?.update(dt);

    // Smooth root body rotation
    if (containerRef.current) {
      // Shortest angular interpolation so rotation never spins 360 unexpectedly
      let diff = ((rotationY - containerRef.current.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      containerRef.current.rotation.y += diff * Math.min(1, dt * 7);
    }

    // Footstep sound cadence while walking or running
    if ((animation === 'Walk' || animation === 'Run') && onFootstep) {
      stepAccumRef.current += dt * (animation === 'Run' ? 3.8 : 2.3);
      if (stepAccumRef.current >= 1) {
        stepAccumRef.current = 0;
        onFootstep();
      }
    } else {
      stepAccumRef.current = 0.6;
    }

    const rig = rigRef.current;

    // 1. Natural Randomized Blinking
    blinkTimerRef.current -= dt;
    if (blinkTimerRef.current <= 0) {
      blinkAmountRef.current = 1.0;
      if (!doubleBlinkRef.current && Math.random() < 0.22) {
        doubleBlinkRef.current = true;
        blinkTimerRef.current = 0.24;
      } else {
        doubleBlinkRef.current = false;
        blinkTimerRef.current = 2.8 + Math.random() * 2.8;
      }
    }
    blinkAmountRef.current = THREE.MathUtils.damp(blinkAmountRef.current, 0, 18, dt);

    // 2. Emotional Expression Layer (Eyes, Eyelids, Pupils, Ears, Head Tilt, Tail Tip)
    let targetUpperLid = -0.84;
    let targetLowerLid = 0.84;
    let targetPupilW = 0.62;
    let targetPupilH = 1.16;
    let headTiltZ = 0;
    let earOutRotZ = 0.22;
    let earPitchX = 0;

    if (animation === 'Sleep') {
      targetUpperLid = 0.16;
      targetLowerLid = 0.04;
      targetPupilW = 0.42;
    } else if (isPetting || animation === 'Happy') {
      // Blissful half-closed affectionate slow squint!
      targetUpperLid = -0.06;
      targetLowerLid = -0.14;
      targetPupilW = 0.88;
      targetPupilH = 1.06;
      earPitchX = 0.12;
    } else if (emotion === 'sleepy') {
      targetUpperLid = -0.32;
      targetLowerLid = 0.46;
      targetPupilW = 0.5;
      earOutRotZ = 0.34;
    } else if (emotion === 'curious') {
      targetUpperLid = -0.92;
      targetLowerLid = 0.9;
      targetPupilW = 0.92;
      targetPupilH = 1.06;
      headTiltZ = 0.16;
      earPitchX = -0.18;
    } else if (emotion === 'affectionate') {
      targetUpperLid = -0.34;
      targetLowerLid = 0.18;
      targetPupilW = 0.86;
      targetPupilH = 1.08;
    } else if (emotion === 'excited') {
      targetUpperLid = -0.94;
      targetLowerLid = 0.9;
      targetPupilW = 1.0;
      targetPupilH = 1.04;
      earOutRotZ = 0.15;
      earPitchX = -0.2;
    } else if (emotion === 'stubborn') {
      targetUpperLid = -0.42;
      targetLowerLid = 0.52;
      targetPupilW = 0.46;
      earOutRotZ = 0.52;
      earPitchX = 0.2;
      headTiltZ = -0.09;
    }

    if (earPerked) {
      earPitchX = -0.26;
      earOutRotZ = 0.14;
      targetPupilW = Math.max(targetPupilW, 0.92);
    }

    // Apply blink cleanly onto front-only eyelid caps
    const finalUpperLid = THREE.MathUtils.lerp(targetUpperLid, 0.16, blinkAmountRef.current);
    const finalLowerLid = THREE.MathUtils.lerp(targetLowerLid, 0.04, blinkAmountRef.current);

    if (rig.upperLidL && rig.upperLidR) {
      rig.upperLidL.rotation.x = THREE.MathUtils.damp(rig.upperLidL.rotation.x, finalUpperLid, 16, dt);
      rig.upperLidR.rotation.x = THREE.MathUtils.damp(rig.upperLidR.rotation.x, finalUpperLid, 16, dt);
    }
    if (rig.lowerLidL && rig.lowerLidR) {
      rig.lowerLidL.rotation.x = THREE.MathUtils.damp(rig.lowerLidL.rotation.x, finalLowerLid, 16, dt);
      rig.lowerLidR.rotation.x = THREE.MathUtils.damp(rig.lowerLidR.rotation.x, finalLowerLid, 16, dt);
    }

    // 3. Real-time Head Gaze & Pupil Micro-Tracking toward User or Target
    let gazeYaw = 0;
    let gazePitch = 0;

    if (containerRef.current && animation !== 'Sleep' && animation !== 'Bath' && animation !== 'Groom') {
      if (lookAtUser || lookTarget) {
        containerRef.current.getWorldPosition(_worldPos);
        if (lookTarget) {
          _targetVec.set(lookTarget[0], lookTarget[1], lookTarget[2]);
        } else {
          _targetVec.copy(camera.position);
        }
        const dx = _targetVec.x - _worldPos.x;
        const dy = _targetVec.y - (_worldPos.y + 0.45);
        const dz = _targetVec.z - _worldPos.z;
        const worldAngleToTarget = Math.atan2(dx, dz);
        let localYaw = worldAngleToTarget - containerRef.current.rotation.y;
        while (localYaw > Math.PI) localYaw -= Math.PI * 2;
        while (localYaw < -Math.PI) localYaw += Math.PI * 2;

        gazeYaw = THREE.MathUtils.clamp(localYaw, -0.58, 0.58);
        const horizDist = Math.max(0.5, Math.hypot(dx, dz));
        gazePitch = THREE.MathUtils.clamp(-Math.atan2(dy, horizDist) * 0.65, -0.35, 0.35);
      } else if (emotion === 'stubborn') {
        gazeYaw = 0.28;
      }
    }

    if (rig.headLookPivot) {
      rig.headLookPivot.rotation.y = THREE.MathUtils.damp(rig.headLookPivot.rotation.y, gazeYaw, 6, dt);
      rig.headLookPivot.rotation.x = THREE.MathUtils.damp(rig.headLookPivot.rotation.x, gazePitch, 6, dt);
      rig.headLookPivot.rotation.z = THREE.MathUtils.damp(rig.headLookPivot.rotation.z, headTiltZ, 6, dt);
    }

    if (rig.pupilL && rig.pupilR) {
      rig.pupilL.scale.x = THREE.MathUtils.damp(rig.pupilL.scale.x, targetPupilW, 10, dt);
      rig.pupilL.scale.y = THREE.MathUtils.damp(rig.pupilL.scale.y, targetPupilH, 10, dt);
      rig.pupilR.scale.x = THREE.MathUtils.damp(rig.pupilR.scale.x, targetPupilW, 10, dt);
      rig.pupilR.scale.y = THREE.MathUtils.damp(rig.pupilR.scale.y, targetPupilH, 10, dt);

      const eyeOffsetX = THREE.MathUtils.clamp(gazeYaw * 0.012, -0.008, 0.008);
      const eyeOffsetY = THREE.MathUtils.clamp(-gazePitch * 0.01, -0.006, 0.006);
      rig.pupilL.position.x = THREE.MathUtils.damp(rig.pupilL.position.x, eyeOffsetX, 10, dt);
      rig.pupilL.position.y = THREE.MathUtils.damp(rig.pupilL.position.y, eyeOffsetY, 10, dt);
      rig.pupilR.position.x = THREE.MathUtils.damp(rig.pupilR.position.x, eyeOffsetX, 10, dt);
      rig.pupilR.position.y = THREE.MathUtils.damp(rig.pupilR.position.y, eyeOffsetY, 10, dt);
    }

    // 4. Expressive Ears & Tail Tip Swish
    if (rig.earL && rig.earR && animation !== 'Yawn') {
      const microTwitch = Math.sin(t * 2.1) > 0.94 ? 0.12 : 0;
      rig.earL.rotation.z = THREE.MathUtils.damp(rig.earL.rotation.z, -earOutRotZ - microTwitch, 8, dt);
      rig.earR.rotation.z = THREE.MathUtils.damp(rig.earR.rotation.z, earOutRotZ, 8, dt);
      rig.earL.rotation.x = THREE.MathUtils.damp(rig.earL.rotation.x, earPitchX, 8, dt);
      rig.earR.rotation.x = THREE.MathUtils.damp(rig.earR.rotation.x, earPitchX, 8, dt);
    }

    if (rig.tailTipPivot) {
      const tipRate = emotion === 'excited' ? 6.5 : emotion === 'stubborn' ? 3.2 : 1.8;
      const tipAmp = emotion === 'stubborn' ? 0.35 : emotion === 'excited' ? 0.42 : 0.16;
      rig.tailTipPivot.rotation.z = Math.sin(t * tipRate) * tipAmp;
    }

    // Gentle purr micro-shimmer when petting
    if (rig.bodyPivot && isPetting) {
      rig.bodyPivot.position.y += Math.sin(t * 28) * 0.0018;
    }
  });

  return (
    <group
      ref={containerRef}
      position={position}
      scale={stageScale}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {loadedScene && <primitive object={loadedScene} />}

      {/* Generous Mobile-Friendly Interactive Touch Zones (Head Petting vs Body Interaction) */}
      {(onHeadClick || onClick) && (
        <mesh
          position={[0, 0.56, 0.31]}
          onClick={(e) => {
            e.stopPropagation();
            if (onHeadClick) onHeadClick();
            else if (onClick) onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.26, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {(onBodyClick || onClick) && (
        <mesh
          position={[0, 0.34, -0.02]}
          onClick={(e) => {
            e.stopPropagation();
            if (onBodyClick) onBodyClick();
            else if (onClick) onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.32, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};
