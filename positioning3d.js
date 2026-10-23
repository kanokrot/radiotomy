import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const host = document.getElementById('position-3d');
if (host) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080d13');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  camera.position.set(3.3, 2.3, 5.8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableRotate = true;
  controls.target.set(0, 1, 0);
  scene.add(new THREE.HemisphereLight(0xe4edf5, 0x25313b, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(-3, 5, 4);
  scene.add(key);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  scene.add(floor);
  const grid = new THREE.GridHelper(8, 16, 0x33414c, 0x202b34);
  grid.position.y = 0.002;
  scene.add(grid);

  const patientPose = new THREE.Group();
  scene.add(patientPose);
  let anatomy = null;
  let viewId = 'pa';
  let equipment = new THREE.Group();
  scene.add(equipment);
  const mat = (color, roughness = 0.6, opacity = 1) => new THREE.MeshStandardMaterial({ color, roughness, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });

  function cloneSkin(root) {
    const clone = root.clone(true);
    clone.traverse(object => {
      if (!object.isMesh) return;
      const layer = object.userData.layer;
      const keep = layer === 'skin' || /skin|body.?surface/i.test(object.name);
      object.visible = keep;
      if (!keep) return;
      const cloneMaterial = material => {
        const copy = material.clone();
        copy.color.set('#c98f75');
        copy.vertexColors = false;
        copy.transparent = true;
        copy.opacity = 0.42;
        copy.depthWrite = false;
        copy.roughness = 0.85;
        return copy;
      };
      object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
    });
    return clone;
  }

  function clearEquipment() {
    scene.remove(equipment);
    equipment.traverse(object => {
      if (object.isMesh || object.isLine || object.isLineSegments) {
        object.geometry?.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material?.dispose());
      }
    });
    equipment = new THREE.Group();
    scene.add(equipment);
  }

  function makeBox(size, color, position, parent = equipment, material = null) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material || mat(color));
    mesh.position.copy(position);
    parent.add(mesh);
    return mesh;
  }

  function makeStand(position, height) {
    makeBox([0.08, height, 0.08], 0x58636c, new THREE.Vector3(position.x, height / 2, position.z));
    makeBox([0.6, 0.08, 0.6], 0x414b54, new THREE.Vector3(position.x, 0.04, position.z));
  }

  function updateEquipment(box) {
    clearEquipment();
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = Math.max(size.x, size.y, size.z);
    const configs = {
      pa: { beam: new THREE.Vector3(0, 0, 1), offset: Math.max(size.z, 0.35) / 2 + 0.7, angle: 0 },
      lateral: { beam: new THREE.Vector3(-1, 0, 0), offset: Math.max(size.x, 0.35) / 2 + 0.7, angle: 0 },
      ap: { beam: new THREE.Vector3(0, 0, -1), offset: Math.max(size.z, 0.35) / 2 + 0.7, angle: 0 },
      supine: { beam: new THREE.Vector3(0, -1, 0), offset: Math.max(size.y, 0.35) / 2 + 0.7, angle: 0 },
      lordotic: { beam: new THREE.Vector3(0, Math.sin(0.2), -Math.cos(0.2)), offset: Math.max(size.z, 0.35) / 2 + 0.7, angle: 0.2 },
      'decubitus-left': { beam: new THREE.Vector3(0, 0, -1), offset: Math.max(size.z, 0.35) / 2 + 0.7, angle: 0 },
      'decubitus-right': { beam: new THREE.Vector3(0, 0, -1), offset: Math.max(size.z, 0.35) / 2 + 0.7, angle: 0 }
    };
    const config = configs[viewId] || configs.pa;
    const beam = config.beam.clone().normalize();
    const detectorPos = center.clone().addScaledVector(beam, config.offset);
    const sourcePos = center.clone().addScaledVector(beam, -Math.max(scale * 1.2, 2.1));
    let panelWidth = Math.max(size.x * 1.35, 1.0);
    let panelHeight = Math.max(size.y * 0.8, 1.3);
    if (viewId === 'lateral') panelWidth = Math.max(size.z * 1.5, 0.8);
    if (viewId === 'supine') {
      panelWidth = Math.max(size.x * 1.35, 1.0);
      panelHeight = Math.max(size.z * 1.35, 1.0);
    }
    if (viewId.startsWith('decubitus')) {
      panelWidth = Math.max(size.x * 1.2, 1.0);
      panelHeight = Math.max(size.y * 1.2, 1.0);
    }
    const normal = beam.clone().negate();
    const detector = new THREE.Group();
    detector.position.copy(detectorPos);
    detector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    equipment.add(detector);
    makeBox([panelWidth, panelHeight, 0.08], 0x9bb7c5, new THREE.Vector3(0, 0, 0), detector, mat(0x9bb7c5, 0.5, 0.52));
    makeBox([panelWidth + 0.12, panelHeight + 0.12, 0.06], 0x526b79, new THREE.Vector3(0, 0, -0.07), detector);
    if (viewId === 'pa' || viewId === 'lateral' || viewId === 'ap') makeStand(detectorPos, detectorPos.y);

    const sourceGroup = new THREE.Group();
    sourceGroup.position.copy(sourcePos);
    sourceGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beam);
    equipment.add(sourceGroup);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.42, 20), mat(0xd1a65a));
    sourceGroup.add(tube);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.32), mat(0x778894));
    head.position.y = -0.24;
    sourceGroup.add(head);
    const coneLength = sourcePos.distanceTo(detectorPos) * 0.72;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.max(scale * 0.34, 0.5), coneLength, 24, 1, true), mat(0x75b7d0, 0.7, 0.12));
    cone.position.copy(sourcePos).addScaledVector(beam, coneLength / 2);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beam);
    equipment.add(cone);
    const arrow = new THREE.ArrowHelper(beam, sourcePos.clone().addScaledVector(beam, 0.32), Math.max(scale * 0.7, 1), 0xf1c45c, 0.2, 0.12);
    equipment.add(arrow);
  }

  function applyView() {
    if (!anatomy) return;
    patientPose.rotation.set(0, 0, 0);
    if (viewId === 'supine') patientPose.rotation.x = -Math.PI / 2;
    if (viewId === 'decubitus-left') patientPose.rotation.z = Math.PI / 2;
    if (viewId === 'decubitus-right') patientPose.rotation.z = -Math.PI / 2;
    patientPose.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(patientPose);
    const min = box.min;
    patientPose.position.y -= min.y;
    patientPose.position.x -= (box.min.x + box.max.x) / 2;
    patientPose.position.z -= (box.min.z + box.max.z) / 2;
    patientPose.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(patientPose);
    updateEquipment(box);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    controls.target.copy(center);
    const radius = Math.max(size.x, size.y, size.z, 1.4);
    camera.position.copy(center).add(new THREE.Vector3(radius * 1.55, radius * 0.9, radius * 2.6));
    camera.near = Math.max(radius / 100, 0.01);
    camera.far = radius * 30;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function setAnatomy(root) {
    anatomy = root;
    patientPose.clear();
    if (root) patientPose.add(cloneSkin(root));
    applyView();
  }

  function setView(next) { viewId = next; applyView(); }
  function resize() {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  window.chestPosition3D = { setAnatomy, setView, resize };
  if (window.atlasAnatomyRoot) setAnatomy(window.atlasAnatomyRoot);
  window.addEventListener('resize', resize);
  animate();
  requestAnimationFrame(resize);
}
