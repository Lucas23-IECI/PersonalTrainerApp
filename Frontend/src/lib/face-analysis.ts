// =============================================
// Face Analysis — MediaPipe Face Mesh
// Local AI symmetry/torsion/midline analysis
// =============================================

import type { FaceAnalysisResult } from "./face-photo-db";

// Landmark indices for key facial features
const LANDMARKS = {
  // Midline
  noseTip: 1,
  noseBridge: 6,
  forehead: 10,
  chin: 152,
  // Eyes
  leftEyeInner: 133,
  leftEyeOuter: 33,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  leftIris: 468,
  rightIris: 473,
  // Mouth
  mouthLeft: 61,
  mouthRight: 291,
  upperLip: 13,
  lowerLip: 14,
  // Jaw
  jawLeft: 132,
  jawRight: 361,
  jawLeftLow: 172,
  jawRightLow: 397,
  // Cheeks
  cheekLeft: 93,
  cheekRight: 323,
} as const;

let faceLandmarkerInstance: unknown = null;
let isLoading = false;
let loadPromise: Promise<unknown> | null = null;

async function getFaceLandmarker(): Promise<unknown> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
      );

      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });

      return faceLandmarkerInstance;
    } catch {
      // GPU fallback to CPU
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = vision;
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
        );
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
        });
        return faceLandmarkerInstance;
      } catch (e) {
        faceLandmarkerInstance = null;
        loadPromise = null;
        throw e;
      }
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

export function isAnalysisLoading(): boolean {
  return isLoading;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angleBetween(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

function symmetryScore(leftDist: number, rightDist: number): number {
  const max = Math.max(leftDist, rightDist);
  if (max === 0) return 100;
  return Math.round((1 - Math.abs(leftDist - rightDist) / max) * 100);
}

export async function analyzeFaceImage(imageElement: HTMLImageElement): Promise<FaceAnalysisResult> {
  const landmarker = await getFaceLandmarker() as { detect: (img: HTMLImageElement) => { faceLandmarks: Array<Array<{ x: number; y: number; z: number }>> } };

  const result = landmarker.detect(imageElement);
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    throw new Error("No face detected");
  }

  const lm = result.faceLandmarks[0];

  // Extract key landmarks
  const noseTip = lm[LANDMARKS.noseTip];
  const chin = lm[LANDMARKS.chin];
  const forehead = lm[LANDMARKS.forehead];

  const leftEyeInner = lm[LANDMARKS.leftEyeInner];
  const leftEyeOuter = lm[LANDMARKS.leftEyeOuter];
  const rightEyeInner = lm[LANDMARKS.rightEyeInner];
  const rightEyeOuter = lm[LANDMARKS.rightEyeOuter];

  const mouthLeft = lm[LANDMARKS.mouthLeft];
  const mouthRight = lm[LANDMARKS.mouthRight];

  const jawLeft = lm[LANDMARKS.jawLeft];
  const jawRight = lm[LANDMARKS.jawRight];
  const jawLeftLow = lm[LANDMARKS.jawLeftLow];
  const jawRightLow = lm[LANDMARKS.jawRightLow];

  const cheekLeft = lm[LANDMARKS.cheekLeft];
  const cheekRight = lm[LANDMARKS.cheekRight];

  // ── Midline Deviation ──
  // Expected midline: forehead → chin
  // Actual midline: through nose tip
  const expectedMid = midpoint(
    midpoint(leftEyeOuter, rightEyeOuter),
    midpoint(jawLeft, jawRight)
  );
  const midlineAngle = angleBetween(forehead, chin);
  const midlineDeviation = Math.abs(midlineAngle - 270) > 180
    ? 360 - Math.abs(midlineAngle - 270)
    : Math.abs(midlineAngle - 270); // Deviation from vertical

  // ── Eye Symmetry ──
  const leftEyeWidth = distance(leftEyeInner, leftEyeOuter);
  const rightEyeWidth = distance(rightEyeInner, rightEyeOuter);
  const eyeSym = symmetryScore(leftEyeWidth, rightEyeWidth);

  // Also check eye height relative to midline  
  const eyeMidLeft = midpoint(leftEyeInner, leftEyeOuter);
  const eyeMidRight = midpoint(rightEyeInner, rightEyeOuter);
  const eyeHeightDiff = Math.abs(eyeMidLeft.y - eyeMidRight.y);
  const eyeHeightSym = Math.max(0, 100 - eyeHeightDiff * 500); // penalize height diff
  const eyeSymmetry = Math.round((eyeSym + eyeHeightSym) / 2);

  // ── Mouth Symmetry ──
  const mouthMid = midpoint(mouthLeft, mouthRight);
  const mouthLeftDist = distance(mouthLeft, noseTip);
  const mouthRightDist = distance(mouthRight, noseTip);
  const mouthSymmetry = symmetryScore(mouthLeftDist, mouthRightDist);

  // ── Jaw Symmetry ──
  const jawLeftDist = distance(jawLeft, noseTip);
  const jawRightDist = distance(jawRight, noseTip);
  const jawLowLeftDist = distance(jawLeftLow, chin);
  const jawLowRightDist = distance(jawRightLow, chin);
  const jawSym1 = symmetryScore(jawLeftDist, jawRightDist);
  const jawSym2 = symmetryScore(jawLowLeftDist, jawLowRightDist);
  const jawSymmetry = Math.round((jawSym1 + jawSym2) / 2);

  // ── Chin Torsion ──
  // Angle between chin and midline of eyes
  const eyeMidline = midpoint(eyeMidLeft, eyeMidRight);
  const chinAngle = angleBetween(eyeMidline, chin);
  const chinTorsion = Math.abs(chinAngle - 90) > 180
    ? 360 - Math.abs(chinAngle - 90)
    : Math.abs(chinAngle - 90);

  // ── Overall Symmetry Score ──
  const overallSymmetry = Math.round(
    eyeSymmetry * 0.25 +
    mouthSymmetry * 0.25 +
    jawSymmetry * 0.25 +
    Math.max(0, 100 - midlineDeviation * 10) * 0.15 +
    Math.max(0, 100 - chinTorsion * 10) * 0.10
  );

  // Extract landmark pairs for overlay drawing
  const landmarkPairs = lm.map((l: { x: number; y: number }) => [l.x, l.y]);

  return {
    symmetryScore: Math.min(100, Math.max(0, overallSymmetry)),
    midlineDeviation: Math.round(midlineDeviation * 10) / 10,
    chinTorsion: Math.round(chinTorsion * 10) / 10,
    eyeSymmetry: Math.min(100, Math.max(0, eyeSymmetry)),
    mouthSymmetry: Math.min(100, Math.max(0, mouthSymmetry)),
    jawSymmetry: Math.min(100, Math.max(0, jawSymmetry)),
    landmarks: landmarkPairs,
    timestamp: new Date().toISOString(),
  };
}
