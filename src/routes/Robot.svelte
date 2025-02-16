<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { jointAngles } from '$lib/stores/robotStore';
  import { get } from 'svelte/store';

  let container;
  let camera, scene, renderer, controls;
  let robot = {
    base: null,
    joints: [],
    links: [],
  };

  const JOINT_RADIUS = 0.15;
  const LINK_RADIUS = 0.05;
  const LINK_LENGTHS = [1, 0.8, 0.8, 0.6, 0.4, 0.3, 0.2]; // Length of each link
  const JOINT_AXES = [
    new THREE.Vector3(0, 1, 0), // Joint 1 rotates around Y
    new THREE.Vector3(1, 0, 0), // Joint 2 rotates around X
    new THREE.Vector3(0, 1, 0), // Joint 3 rotates around Y
    new THREE.Vector3(1, 0, 0), // Joint 4 rotates around X
    new THREE.Vector3(0, 1, 0), // Joint 5 rotates around Y
    new THREE.Vector3(1, 0, 0), // Joint 6 rotates around X
    new THREE.Vector3(0, 1, 0), // Joint 7 rotates around Y
  ];

  function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(3, 3, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    scene.add(new THREE.AmbientLight(0x404040));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Grid
    scene.add(new THREE.GridHelper(10, 10));

    createRobot();

    window.addEventListener('resize', onWindowResize, false);
  }

  function createRobot() {
    const jointMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff });
    const linkMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
    robot.base = new THREE.Mesh(baseGeometry, new THREE.MeshPhongMaterial({ color: 0x666666 }));
    robot.base.position.set(0, 0.1, 0);
    scene.add(robot.base);

    let currentMatrix = new THREE.Matrix4().identity();

    for (let i = 0; i < 7; i++) {
      // Joint
      const jointGeometry = new THREE.SphereGeometry(JOINT_RADIUS, 32, 32);
      const joint = new THREE.Mesh(jointGeometry, jointMaterial);
      scene.add(joint);
      robot.joints.push(joint);

      // Link
      if (i < 6) {
        const linkGeometry = new THREE.CylinderGeometry(LINK_RADIUS, LINK_RADIUS, 1, 32);
        const link = new THREE.Mesh(linkGeometry, linkMaterial);
        scene.add(link);
        robot.links.push(link);
      }
    }

    updateRobotPose(get(jointAngles));
  }

  function updateRobotPose(angles) {
    let currentMatrix = new THREE.Matrix4();
    let previousPosition = new THREE.Vector3(0, 0.1, 0);
    let previousRotation = new THREE.Quaternion();

    robot.joints.forEach((joint, index) => {
      const angle = angles[`joint${index + 1}`];
      const axis = JOINT_AXES[index];

      // Create rotation matrix
      const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
      currentMatrix.multiply(rotationMatrix);

      // Compute new joint position
      const newPosition = new THREE.Vector3(0, LINK_LENGTHS[index] || 0, 0);
      newPosition.applyMatrix4(currentMatrix);

      // Update joint position
      joint.position.copy(previousPosition.clone().add(newPosition));
      joint.setRotationFromQuaternion(previousRotation);

      // Update link
      if (index < robot.links.length) {
        const link = robot.links[index];
        const midPoint = new THREE.Vector3().lerpVectors(previousPosition, joint.position, 0.5);
        link.position.copy(midPoint);

        // Compute link direction and set rotation
        const direction = new THREE.Vector3().subVectors(joint.position, previousPosition).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(up, direction);
        link.setRotationFromQuaternion(quaternion);

        // Set link length dynamically
        link.scale.y = new THREE.Vector3().distanceTo.call(previousPosition, joint.position);
      }

      previousPosition.copy(joint.position);
      previousRotation.setFromRotationMatrix(currentMatrix);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // Subscribe to joint angle changes from the store
  jointAngles.subscribe((angles) => {
    if (robot.joints.length > 0) {
      updateRobotPose(angles);
    }
  });

  onMount(() => {
    init();
    animate();

    return () => {
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
    };
  });

  function randomizeJoints() {
    jointAngles.set({
      joint1: Math.random() * Math.PI - Math.PI / 2,
      joint2: Math.random() * Math.PI - Math.PI / 2,
      joint3: Math.random() * Math.PI - Math.PI / 2,
      joint4: Math.random() * Math.PI - Math.PI / 2,
      joint5: Math.random() * Math.PI - Math.PI / 2,
      joint6: Math.random() * Math.PI - Math.PI / 2,
      joint7: Math.random() * Math.PI - Math.PI / 2,
    });
  }
</script>

<div class="w-full h-full flex flex-col">
  <button on:click={randomizeJoints} class="p-2 bg-blue-500 text-white rounded m-2"> Randomize Joints </button>
  <div bind:this={container} style="width: 100vw; height: 100vh;"></div>
</div>

<style>
  div {
    touch-action: none;
  }
</style>
