import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createEffect, getBackgroundColor } from '../three/effects';
import styles from './WeatherBackground.module.css'

function WeatherBackground({ category }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;

        // three.jsのセットアップ
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(getBackgroundColor(category));

        const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(renderer.domElement);

        const effect = createEffect(category, scene);

        // アニメーションループ
        let animationId;
        function loop() {
            animationId = requestAnimationFrame(loop);
            effect.animate();
            renderer.render(scene, camera);
        }
        loop();

        // リサイズ
        function onResize() {
            camera.aspect = mount.clientWidth / mount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mount.clientWidth, mount.clientHeight);
        }
        window.removeEventListener('resize', onResize);

        // クリーンアップ
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
            if (scene.fog) scene.fog = null; 
        }
    }, [category]);
    return <div ref={mountRef} style={{ position: 'absolute', inset: 0}} />;
}

export default WeatherBackground