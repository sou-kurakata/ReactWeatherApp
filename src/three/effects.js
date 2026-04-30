import * as THREE from 'three';

// 雨のエフェクト
export function createRain(screen) {
    const count = 3000;
    // 雨の通る場所の座標
    // 2は始点と終点、3はxyzの座標
    const position = new Float32Array(count * 2 * 3)

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 20; // *20を調整すると雨の広がりの幅が変わる
        const y = Math.random() * 20; // *20を調整すると雨の始点の高さが変わる
        const z = (Math.random() - 0.5) * 10; // *10を調整すると奥行きは変わる
        // 線の始点
        position[i * 6] = x;
        position[i * 6 + 1] = y;
        position[i * 6 + 2] = z;
        // 線の終点(-0.05などで少し斜めに調整)
        position[i * 6 + 3] = x - 0.05;
        position[i * 6 + 4] = y - 0.35;
        position[i * 6 + 5] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3)) // THREE.BufferAttributeは頂点座標を保持する


    const material = new THREE.LineBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.55})
    const rain = new THREE.LineSegments(geometry, material);
    screen.add(rain);

    function animate() {
        const pos = rain.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            // 雨の線ごと下に動かす。
            // 0.2を調整すると速さが変わる
            pos[i * 6 + 1] -= 0.2
            pos[i * 6 + 4] -= 0.2
            // 地面に当たったら上に戻す
            if (pos[i * 6 + 1] < -5) {
                const newY = 15 + Math.random() * 5;
                pos[i * 6 + 1] = newY;
                pos[i * 6 + 4] = newY - 0.35;
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;// trueにすることで位置の変更を反映させることができる
    }
    return { mesh: rain, animate}
}