import '../css/style.scss';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';

import GUI from "lil-gui";

class Main {
  constructor() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.canvas = document.querySelector("#canvas");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.viewport.width, this.viewport.height);

    this.scene = new THREE.Scene();
    this.camera = null;
    this.mesh = null;

    this.controls = null;

    this.gui = new GUI();

    this.effectObj = {
      glitch: true,
      sobel: true,
      dotscreen: true,
      rgbshift: true,
      bloom: false,
    }

    // post processing
    this.composer = null;
    this.effectAfterimage = null;
    this.effectSobel = null;

    this._init();
    this._setComposer();
    this._setEffectAfterimage();
    this._setEffectSobel();


    this._setGUI();
    this._update();
    this._addEvent();
  }

  _setCamera() {
    //ウインドウとWebGL座標を一致させる
    const fov = 45;
    const fovRadian = (fov / 2) * (Math.PI / 180); //視野角をラジアンに変換
    const distance = (this.viewport.height / 2) / Math.tan(fovRadian); //ウインドウぴったりのカメラ距離
    this.camera = new THREE.PerspectiveCamera(fov, this.viewport.width / this.viewport.height, 1, distance * 2);
    this.camera.position.z = distance;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
  }

  _setControlls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  _setGUI() {
    console.log(this.effectAfterimage);
    this.gui.add(this.effectAfterimage.uniforms.damp, 'value', 0, 1).name('残像');

    this.gui.add(this.effectObj, 'sobel').name('エッジ検出');

    this.gui.onChange((e) => {

      const guiProperty = e.property;

      if(guiProperty === 'sobel') {
        if(e.value) {
          this._onEffectSobel();
        } else {
          this._offEffectSobel();
        }
      }

    })
  }

  _setLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 1, 1);
    this.scene.add(light);
  }

  _setComposer() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
  }

  _setEffectAfterimage() {
    this.effectAfterimage = new AfterimagePass();
    this.composer.addPass(this.effectAfterimage);
  }

  _setEffectSobel() {
    const effectGrayScale = new ShaderPass(LuminosityShader);
    this.composer.addPass(effectGrayScale);
  
    this.effectSobel = new ShaderPass(SobelOperatorShader);
    this.effectSobel.uniforms['resolution'].value.x = window.innerWidth * window.devicePixelRatio * 0.1;
    this.effectSobel.uniforms['resolution'].value.y = window.innerHeight * window.devicePixelRatio * 0.1;
    if(this.effectObj.sobel === false) {
      this._offEffectSobel();
    } else {
      this._onEffectSobel();
    }
    this.composer.addPass(this.effectSobel);
  }
  _onEffectSobel() {
    this.effectSobel.enabled = true;
  }
  _offEffectSobel() {
    this.effectSobel.enabled = false;
  }

  _addMesh() {
    const geometry = new THREE.CapsuleGeometry( 100, 300, 32, 32 ); 
    const material = new THREE.MeshStandardMaterial({color: 0x444444});
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  _init() {
    this._setCamera();
    this._setControlls();
    this._setLight();
    this._addMesh();
  }

  _update() {
    this.mesh.rotation.y += 0.1;
    this.mesh.rotation.x += 0.05;
    this.mesh.rotation.z += 0.005;

    this.mesh.position.x = Math.sin(Date.now() * 0.003) * 200;

    this.camera.position.z += Math.sin(Date.now() * 0.002) * 8;
    // this.camera.position.y += Math.sin(Date.now() * 0.004) * 15;


    // 動画テクスチャがある場合、更新する
    if (this.videoTexture) {
      this.videoTexture.needsUpdate = true;
    }

    //レンダリング
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    this.composer.render();
    requestAnimationFrame(this._update.bind(this));
  }

  _onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }
    // レンダラーのサイズを修正
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    // カメラのアスペクト比を修正
    this.camera.aspect = this.viewport.width / this.viewport.height;
    this.camera.updateProjectionMatrix();
  }

  _addEvent() {
    window.addEventListener("resize", this._onResize.bind(this));
  }
}

new Main();



