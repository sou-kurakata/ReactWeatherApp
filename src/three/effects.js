import * as THREE from 'three';

// 雨のエフェクト
export function createRain(scene) {
    const count = 3000;
    // 雨の通る場所の座標
    // 2は始点と終点、3はxyzの座標
    const position = new Float32Array(count * 2 * 3)

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 20; // *20を調整すると雨の広がりの幅が変わる
        const y = Math.random() * 20; // *20を調整すると雨の始点の高さが変わる
        const z = (Math.random() - 0.5) * 10; // *10を調整すると奥行きは変わる
        // 線の始点
        position[i * 6]     = x;
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
    scene.add(rain);

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

// 雪のエフェクト
export function createSnow(scene) {
    // 中心が白く外が透明な円テクスチャで雪片らしく見せる
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');// getContextはcanvasへアクセスするための入り口を作る
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);// 引数: (中心X, 中心Y, 開始半径, 中心X, 中心Y, 終了半径)
    grad.addColorStop(0,   'rgba(255, 255, 255, 1)');// 中心
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');// 中間
    grad.addColorStop(1,   'rgba(255, 255, 255, 0)');// 外側
    ctx.fillStyle = grad;// 塗りつぶしの色に、先ほど作ったグラデーションを指定
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);// ctx.arc(中心X, 中心Y, 半径, 開始角度, 終了角度)
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);  
    
    // 雪片の配置
    const count = 2000;
    const position = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        position[i * 3]     = (Math.random() - 0.5) * 20;
        position[i * 3 + 1] = Math.random() * 20;
        position[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))

    const material = new THREE.PointsMaterial({
        map: texture,// ↑で作ったもの
        size: 0.25,
        transparent: true,// 透明度を有効にする
        opacity:0.9,
        depthWrite: false,// 重なった時に後ろの雪が隠れない設定
    })

    const snow = new THREE.Points(geometry, material);
    scene.add(snow);

    function animate() {
        const pos = snow.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] -= 0.03// y座標を下に動かして雪を降らせる
            pos[i * 3]     += Math.sin(Date.now() * 0.001 + i) * 0.002;// x座標を動かして雪を動かす
            if (pos[i * 3 + 1] < -5) pos[i * 3 + 1] = 15;
        }
        snow.geometry.attributes.position.needsUpdate = true;
    }
    return {mesh: snow, animate};
}

// 晴れのエフェクト
export function createClear(scene) {
    const sunGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe066})
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(3.5, 3, -2);// 太陽の位置
    scene.add(sun);

    // 中心から外に向かって透明になるグラデーションで光彩テクスチャを生成
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const ctx = glowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0,    'rgba(255, 240, 100, 0.8)');
    grad.addColorStop(0.4,  'rgba(255, 220, 50, 0.3)');
    grad.addColorStop(1,    'rgba(255, 200, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(glowCanvas),
        transparent: true,
        depthWrite: false,
    }))
    glow.scale.set(6, 6, 1);
    glow.position.copy(sun.position);
    scene.add(glow);

    // 太陽の大きさを少しづつ変える関数
    let t = 0;
    function animate() {
        t += 0.02
        const pulse = 1 + Math.sin(t) * 0.04;
        sun.scale.setScalar(pulse);
        glow.scale.set(6 * pulse, 6 * pulse, 1);
    }

    return { mesh: sun, animate};
}

// 雲のエフェクト
export function createClouds(scene) {
    // 複数の円を重ねてモコモコした雲シルエットを描く
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // 小さな円を並べて雲の輪郭を作る
    const puffs = [
        { x: 80,  y: 80, r: 50 },
        { x: 128, y: 65, r: 60 },
        { x: 176, y: 80, r: 50 },
        { x: 100, y: 95, r: 42 },
        { x: 155, y: 95, r: 42 },
    ]
    puffs.forEach(({ x, y, r }) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0,   'rgba(255,255,255,1)');
        g.addColorStop(0.6, 'rgba(240,240,250,0.9)');
        g.addColorStop(1,   'rgba(220,225,235,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    })
    const texture = new THREE.CanvasTexture(canvas);

    // 複数の Sprite を配置して雲の群れを作る
    const sprites = [];
    for (let i = 0; i < 18; i++) {
        const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.55 + Math.random() * 0.35,
        depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        const w = 4 + Math.random() * 5;
        sprite.scale.set(w, w * 0.55, 1);
        sprite.position.set(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 5 + 1,
        -2 - Math.random() * 3,
        );
        scene.add(sprite);
        sprites.push(sprite);
    }

    function animate() {
        // 右から左へゆっくり流す。画面外に出たら反対側に戻す
        sprites.forEach(s => {
        // 大きさを計算に入れることで大きい雲と小さい雲で速さに差を出して奥行きを持たせる
        s.position.x += 0.004 + s.scale.x * 0.0003;
        if (s.position.x > 14) s.position.x = -14;
        })
    }

    return { mesh: sprites[0], animate };
}

// 雷のエフェクト
export function createThunderstorm(scene) {
    const rain = createRain(scene);
    let flashTimer = 0;

    // 画面全他を覆うプレーンを閃光にする
    // MeshBasicMaterialは光に影響されない
    const flashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    })
    const flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), flashMat);
    flashPlane.position.z = 4;// カメラの手間に配置
    scene.add(flashPlane);

    function animate() {
        rain.animate();
        flashTimer++;
        if (flashTimer > 100 && Math.random() > 0.97) {
            flashMat.opacity = 0.6 + Math.random() * 0.3;
            flashTimer = 0;
        } else {
            flashMat.opacity *= 0.8;// 徐々に透明にする
        }
    }
    return { mesh: rain.mesh, animate};
}

// 霧のエフェクト
export function createMist(scene) {
    scene.fog = new THREE.FogExp2(0x8899aa, 0.15);// 引数は(色, 密度)

    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xaabbcc,
        size: 0.3,
        transparent: true,
        opacity: 0.3,
    })

    const mist = new THREE.Points(geometry, material);
    scene.add(mist);

    function animate() {
        mist.rotation.y += 0.0005;
    }

    return { mesh: mist, animate };
}

// エフェクトのファクトリー関数
export function createEffect(category, scene) {
    switch (category) {
        case 'rain' :
        case 'drizzle' :
            return createRain(scene);
        case 'snow' :
            return createSnow(scene);
        case 'clear' :
            return createClear(scene);
        case 'clouds' :
            return createClouds(scene);
        case 'thunderstorm' :
            return createThunderstorm(scene);
        case 'mist' :
            return createMist(scene);
        default:
            return createClear(scene);
    }
}

// 天気カテゴリに応じた背景色を返す
export function getBackgroundColor(category) {
  const colors = {
    clear:       0x87ceeb,  // 空色
    clouds:      0x708090,  // スレートグレー
    rain:        0x2f4f6f,  // 暗い青
    drizzle:     0x4a6f8a,  // くすんだ青
    snow:        0xdce8f0,  // 薄い水色
    thunderstorm:0x1a1a2e,  // 暗い紫
    mist:        0x8899aa,  // 霞んだグレー
  }
  return colors[category] ?? 0x87ceeb
}