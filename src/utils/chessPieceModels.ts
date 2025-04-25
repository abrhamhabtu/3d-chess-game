import * as THREE from 'three';
import { PieceSymbol, Color } from 'chess.js';

// Basic chess piece geometries
const createPawn = (color: Color): THREE.Group => {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  const baseMaterial = createMaterial(color);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.y = 0.25;
  group.add(body);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.12, 16, 16);
  const head = new THREE.Mesh(headGeometry, baseMaterial);
  head.position.y = 0.45;
  group.add(head);
  
  setupShadows(group);
  return group;
};

const createRook = (color: Color): THREE.Group => {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.1, 16);
  const baseMaterial = createMaterial(color);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.3, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.y = 0.25;
  group.add(body);
  
  // Top
  const topGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
  const top = new THREE.Mesh(topGeometry, baseMaterial);
  top.position.y = 0.45;
  group.add(top);
  
  // Crenellations
  const createMerlon = (x: number, z: number) => {
    const merlonGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.08);
    const merlon = new THREE.Mesh(merlonGeometry, baseMaterial);
    merlon.position.set(x, 0.55, z);
    group.add(merlon);
  };
  
  createMerlon(0.14, 0.14);
  createMerlon(-0.14, 0.14);
  createMerlon(0.14, -0.14);
  createMerlon(-0.14, -0.14);
  
  setupShadows(group);
  return group;
};

const createKnight = (color: Color): THREE.Group => {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.1, 16);
  const baseMaterial = createMaterial(color);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.y = 0.225;
  group.add(body);
  
  // Horse head (simplified)
  const headGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.4);
  const head = new THREE.Mesh(headGeometry, baseMaterial);
  head.position.y = 0.4;
  head.position.z = 0.05;
  head.rotation.x = Math.PI / 8;
  group.add(head);
  
  // Ears
  const earGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
  const ear = new THREE.Mesh(earGeometry, baseMaterial);
  ear.position.set(0, 0.55, -0.05);
  ear.rotation.x = -Math.PI / 4;
  group.add(ear);
  
  setupShadows(group);
  return group;
};

const createBishop = (color: Color): THREE.Group => {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.1, 16);
  const baseMaterial = createMaterial(color);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.22, 0.3, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.y = 0.25;
  group.add(body);
  
  // Top (mitre)
  const topGeometry = new THREE.ConeGeometry(0.15, 0.3, 16);
  const top = new THREE.Mesh(topGeometry, baseMaterial);
  top.position.y = 0.55;
  group.add(top);
  
  // Ball on top
  const ballGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const ball = new THREE.Mesh(ballGeometry, baseMaterial);
  ball.position.y = 0.725;
  group.add(ball);
  
  setupShadows(group);
  return group;
};

const createQueen = (color: Color): THREE.Group => {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.1, 16);
  const baseMaterial = createMaterial(color);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.18, 0.25, 0.35, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.y = 0.275;
  group.add(body);
  
  // Crown
  const crownBaseGeometry = new THREE.CylinderGeometry(0.22, 0.18, 0.08, 16);
  const crownBase = new THREE.Mesh(crownBaseGeometry, baseMaterial);
  crownBase.position.y = 0.49;
  group.add(crownBase);
  
  // Crown points
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const pointGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const point = new THREE.Mesh(pointGeometry, baseMaterial);
    point.position.x = Math.cos(angle) * 0.18;
    point.position.z = Math.sin(angle) * 0.18;
    point.position.y = 0.58;
    group.add(point);
  }
  
  // Top sphere
  const topGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const top = new THREE.Mesh(topGeometry, baseMaterial);
  top.position.y = 0.65;
  group.add(top);
  
  setupShadows(group);
  return group;
};

const createKing = (color: Color): THREE.Group => {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.1, 16);
  const baseMaterial = createMaterial(color);
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.05;
  group.add(base);
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.18, 0.25, 0.4, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.y = 0.3;
  group.add(body);
  
  // Crown
  const crownBaseGeometry = new THREE.CylinderGeometry(0.22, 0.18, 0.08, 16);
  const crownBase = new THREE.Mesh(crownBaseGeometry, baseMaterial);
  crownBase.position.y = 0.54;
  group.add(crownBase);
  
  // Cross base
  const crossBaseGeometry = new THREE.BoxGeometry(0.05, 0.04, 0.05);
  const crossBase = new THREE.Mesh(crossBaseGeometry, baseMaterial);
  crossBase.position.y = 0.63;
  group.add(crossBase);
  
  // Cross vertical
  const crossVertGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.05);
  const crossVert = new THREE.Mesh(crossVertGeometry, baseMaterial);
  crossVert.position.y = 0.725;
  group.add(crossVert);
  
  // Cross horizontal
  const crossHorizGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.05);
  const crossHoriz = new THREE.Mesh(crossHorizGeometry, baseMaterial);
  crossHoriz.position.y = 0.7;
  group.add(crossHoriz);
  
  setupShadows(group);
  return group;
};

// Helper functions
const createMaterial = (color: Color): THREE.MeshStandardMaterial => {
  return new THREE.MeshStandardMaterial({
    color: color === 'w' ? 0xf8fafc : 0x1e293b,
    roughness: 0.5,
    metalness: 0.2
  });
};

const setupShadows = (group: THREE.Group): void => {
  group.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
};

// Main factory function
export const createChessPiece = (piece: PieceSymbol, color: Color): THREE.Group => {
  let model: THREE.Group;
  
  switch (piece) {
    case 'p':
      model = createPawn(color);
      break;
    case 'r':
      model = createRook(color);
      break;
    case 'n':
      model = createKnight(color);
      break;
    case 'b':
      model = createBishop(color);
      break;
    case 'q':
      model = createQueen(color);
      break;
    case 'k':
      model = createKing(color);
      break;
    default:
      model = new THREE.Group();
  }
  
  return model;
};