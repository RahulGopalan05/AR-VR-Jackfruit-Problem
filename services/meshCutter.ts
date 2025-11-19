
import * as THREE from 'three';

const EPSILON = 1e-6; // Tolerance for floating point comparisons

// Helper to determine which side of a line a point is on in 2D.
// Returns > 0 for left, < 0 for right, 0 for on the line.
const getSide = (p: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2): number => {
  const value = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  if (Math.abs(value) < EPSILON) return 0;
  return value;
};

// Line-segment intersection helper in 2D
const getLineIntersection = (p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2, p4: THREE.Vector2): THREE.Vector2 | null => {
    const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (den === 0) return null; // Parallel

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return new THREE.Vector2(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
    }
    return null;
}

export const cutMesh = (
  geometry: THREE.BufferGeometry,
  cutPath: THREE.Vector2[]
): THREE.BufferGeometry[] => {
  if (cutPath.length < 2) return [geometry];

  const cutStart = cutPath[0];
  const cutEnd = cutPath[cutPath.length - 1];

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const oldVertices: THREE.Vector3[] = [];
  for (let i = 0; i < posAttr.count; i++) {
    oldVertices.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
  }

  const oldFaces: number[] = geometry.index ? Array.from(geometry.index.array) : Array.from({ length: posAttr.count }, (_, i) => i);

  const leftVerts: THREE.Vector3[] = [];
  const rightVerts: THREE.Vector3[] = [];
  const oldToLeftMap: { [key: number]: number } = {};
  const oldToRightMap: { [key: number]: number } = {};

  // 1. Classify existing vertices
  oldVertices.forEach((v, i) => {
    const side = getSide(new THREE.Vector2(v.x, v.z), cutStart, cutEnd);
    if (side >= 0) {
      oldToLeftMap[i] = leftVerts.length;
      leftVerts.push(v);
    }
    if (side <= 0) {
      oldToRightMap[i] = rightVerts.length;
      rightVerts.push(v);
    }
  });

  const leftFaces: number[] = [];
  const rightFaces: number[] = [];

  // 2. Process faces
  for (let i = 0; i < oldFaces.length; i += 3) {
    const indices = [oldFaces[i], oldFaces[i + 1], oldFaces[i + 2]];
    const vertices = indices.map(idx => oldVertices[idx]);
    const sides = vertices.map(v => getSide(new THREE.Vector2(v.x, v.z), cutStart, cutEnd));
    
    const onLeft = sides.filter(s => s >= 0).length;
    const onRight = sides.filter(s => s <= 0).length;
    
    if (onLeft === 3) {
      leftFaces.push(...indices.map(idx => oldToLeftMap[idx]));
    } else if (onRight === 3) {
      rightFaces.push(...indices.map(idx => oldToRightMap[idx]));
    } else {
      // Face is split, needs re-triangulation
      const singleSideIndex = sides.findIndex(s => Math.sign(s) !== Math.sign(sides[(sides.findIndex(s => Math.sign(s) !== 0) + 1) % 3] || 1));
      
      const singlePoint = { idx: indices[singleSideIndex], vert: vertices[singleSideIndex], side: sides[singleSideIndex] };
      const otherPoints = indices.map((idx, j) => j === singleSideIndex ? null : { idx, vert: vertices[j], side: sides[j] }).filter(Boolean) as {idx: number; vert: THREE.Vector3; side: number;}[];
      
      const v_single_2d = new THREE.Vector2(singlePoint.vert.x, singlePoint.vert.z);
      const v_other1_2d = new THREE.Vector2(otherPoints[0].vert.x, otherPoints[0].vert.z);
      const v_other2_2d = new THREE.Vector2(otherPoints[1].vert.x, otherPoints[1].vert.z);

      const intersection1_2d = getLineIntersection(v_single_2d, v_other1_2d, cutStart, cutEnd);
      const intersection2_2d = getLineIntersection(v_single_2d, v_other2_2d, cutStart, cutEnd);

      if (intersection1_2d && intersection2_2d) {
        const t1 = v_single_2d.distanceTo(intersection1_2d) / v_single_2d.distanceTo(v_other1_2d);
        const ip1 = new THREE.Vector3().lerpVectors(singlePoint.vert, otherPoints[0].vert, t1);
        
        const t2 = v_single_2d.distanceTo(intersection2_2d) / v_single_2d.distanceTo(v_other2_2d);
        const ip2 = new THREE.Vector3().lerpVectors(singlePoint.vert, otherPoints[1].vert, t2);
        
        const ip1_left_idx = leftVerts.length; leftVerts.push(ip1);
        const ip1_right_idx = rightVerts.length; rightVerts.push(ip1);
        const ip2_left_idx = leftVerts.length; leftVerts.push(ip2);
        const ip2_right_idx = rightVerts.length; rightVerts.push(ip2);
        
        if (singlePoint.side > 0) { // Single point is on the left
          leftFaces.push(oldToLeftMap[singlePoint.idx], ip1_left_idx, ip2_left_idx);
          rightFaces.push(oldToRightMap[otherPoints[0].idx], oldToRightMap[otherPoints[1].idx], ip2_right_idx);
          rightFaces.push(oldToRightMap[otherPoints[0].idx], ip2_right_idx, ip1_right_idx);
        } else { // Single point is on the right
          rightFaces.push(oldToRightMap[singlePoint.idx], ip1_right_idx, ip2_right_idx);
          leftFaces.push(oldToLeftMap[otherPoints[0].idx], oldToLeftMap[otherPoints[1].idx], ip2_left_idx);
          leftFaces.push(oldToLeftMap[otherPoints[0].idx], ip2_left_idx, ip1_left_idx);
        }
      } else { // Fallback for complex cases: just assign the whole triangle to one side
          if(onLeft > onRight) leftFaces.push(...indices.map(idx => oldToLeftMap[idx]));
          else rightFaces.push(...indices.map(idx => oldToRightMap[idx]));
      }
    }
  }

  if (leftFaces.length === 0 || rightFaces.length === 0 || leftVerts.length < 3 || rightVerts.length < 3) {
    return [geometry]; // No meaningful cut, return original
  }

  const createGeo = (verts: THREE.Vector3[], faces: number[]): THREE.BufferGeometry => {
    const newGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(verts.length * 3);
    verts.forEach((v, i) => v.toArray(positions, i * 3));
    newGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    newGeo.setIndex(faces);
    newGeo.computeVertexNormals();
    return newGeo;
  }

  return [createGeo(leftVerts, leftFaces), createGeo(rightVerts, rightFaces)];
};
