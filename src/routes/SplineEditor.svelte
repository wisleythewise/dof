<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
  import { GUI } from 'lil-gui';

  let container;

  onMount(() => {
    let camera, scene, renderer, controls;
    let transformControl;
    let splineHelperObjects = [];
    let splinePointsLength = 4;
    let positions = [];
    let raycaster = new THREE.Raycaster();
    let pointer = new THREE.Vector2();
    let selectedObject = null;
    let geometry = new THREE.SphereGeometry(10, 16, 16);
    let splines = {};
    const ARC_SEGMENTS = 200;

    let params = {
      addPoint,
      removePoint,
      exportSpline,
    };

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // Camera
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.set(0, 250, 1000);
      scene.add(camera);

      // Lights
      scene.add(new THREE.AmbientLight(0xf0f0f0, 2));
      const light = new THREE.DirectionalLight(0xffffff, 2);
      light.position.set(0, 500, 200);
      scene.add(light);

      // Grid Helper
      const helper = new THREE.GridHelper(1000, 50);
      helper.position.y = -100;
      helper.material.opacity = 0.3;
      helper.material.transparent = true;
      scene.add(helper);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      // Orbit Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.addEventListener('change', render);

      // Transform Controls
      transformControl = new TransformControls(camera, renderer.domElement);
      transformControl.addEventListener('change', updateSplineOutline);
      transformControl.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
      });

      scene.add(transformControl);

      // Event Listeners
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove);
      window.addEventListener('resize', onWindowResize);

      // GUI
      const gui = new GUI();
      gui.add(params, 'addPoint');
      gui.add(params, 'removePoint');
      gui.add(params, 'exportSpline');
      gui.open();

      // Create Initial Spline Objects
      for (let i = 0; i < splinePointsLength; i++) {
        addSplineObject();
      }

      // Create Splines
      createSplines();
      render();
    }

    function createSplines() {
      const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

      const geometry = new THREE.BufferGeometry();
      let curve = new THREE.CatmullRomCurve3(positions);
      curve.curveType = 'centripetal';
      curve.closed = false;

      geometry.setFromPoints(curve.getPoints(ARC_SEGMENTS));
      let line = new THREE.Line(geometry, curveMaterial);
      scene.add(line);
      splines.centripetal = { curve, mesh: line };

      updateSplineOutline();
    }

    function addSplineObject(position) {
      const material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
      const object = new THREE.Mesh(geometry, material);
      object.userData.draggable = true; // Allow interaction

      object.position.copy(position || new THREE.Vector3(Math.random() * 500 - 250, Math.random() * 100, Math.random() * 500 - 250));

      object.castShadow = true;
      object.receiveShadow = true;
      scene.add(object);
      splineHelperObjects.push(object);
      positions.push(object.position);
      return object;
    }

    function addPoint() {
      addSplineObject();
      updateSplineOutline();
      render();
    }

    function removePoint() {
      if (splineHelperObjects.length <= 2) return;
      const object = splineHelperObjects.pop();
      scene.remove(object);
      positions.pop();
      updateSplineOutline();
      render();
    }

    function updateSplineOutline() {
      const spline = splines.centripetal.curve;
      const line = splines.centripetal.mesh;

      spline.points = positions;
      line.geometry.setFromPoints(spline.getPoints(ARC_SEGMENTS));
      line.geometry.attributes.position.needsUpdate = true;
      render();
    }

    function exportSpline() {
      console.log(
        JSON.stringify(
          positions.map((p) => ({ x: p.x, y: p.y, z: p.z })),
          null,
          2,
        ),
      );
    }

    function render() {
      renderer.render(scene, camera);
    }

    function onPointerDown(event) {
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(splineHelperObjects, false);

      if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        transformControl.attach(selectedObject);
      } else {
        transformControl.detach();
      }
    }

    function onPointerMove(event) {
      if (!selectedObject) return;
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(splineHelperObjects, false);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        transformControl.attach(object);
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      render();
    }

    init();
  });
</script>

<div bind:this={container} style="width: 100vw; height: 100vh;"></div>
