# React + Three.js で作る天気アプリ 解説テキスト

## 目次

1. [このアプリで何を作るか](#1-このアプリで何を作るか)
2. [使用技術の概要](#2-使用技術の概要)
3. [環境構築](#3-環境構築)
4. [ファイル構成](#4-ファイル構成)
5. [エントリーポイント — `index.html` / `main.jsx`](#5-エントリーポイント--indexhtml--mainjsx)
6. [グローバルスタイル — `index.css`](#6-グローバルスタイル--indexcss)
7. [天気データの取得 — `useWeather.js`](#7-天気データの取得--useweatherjs)
8. [天気情報の表示 — `WeatherDisplay.jsx`](#8-天気情報の表示--weatherdisplayjsx)
9. [Three.js エフェクト — `effects.js`](#9-threejs-エフェクト--effectsjs)
10. [Three.js 背景コンポーネント — `WeatherBackground.jsx`](#10-threejs-背景コンポーネント--weatherbackgroundjsx)
11. [アプリのルート — `App.jsx`](#11-アプリのルート--appjsx)
12. [動かしてみよう](#12-動かしてみよう)

---

## 1. このアプリで何を作るか

ブラウザの位置情報を使って **現在地の天気を取得** し、天気に合わせた **Three.js アニメーション背景** を表示する Web アプリです。

| 天気 | 背景色 | エフェクト |
|------|--------|------------|
| 晴れ | 空色 | 太陽 + 光彩が脈打つ |
| 曇り | スレートグレー | 雲が横に流れる |
| 雨 | 暗い青 | 雨粒が落ちる |
| 霧雨 | くすんだ青 | 雨（細め） |
| 雪 | 薄い水色 | 雪片がゆらゆら落ちる |
| 雷雨 | 暗い紫 | 雨 + ランダムな稲妻フラッシュ |
| 霧 | 霞んだグレー | 霧のパーティクルが漂う |

---

## 2. 使用技術の概要

### React とは

UI を **コンポーネント（部品）の組み合わせ** で作るための JavaScript ライブラリです。
「表示したいデータ（State）が変わったら、自動的に画面を再描画する」という仕組みが核心です。

### Three.js とは

ブラウザ上で **3D グラフィックス** を描く JavaScript ライブラリです。
内部的には WebGL（GPU を使う低レベル API）を使っていますが、Three.js が複雑な部分を隠してくれるので、シンプルなコードで 3D 表現ができます。

### Vite とは

モダンな **フロントエンドビルドツール** です。
開発中は変更を即座にブラウザに反映（HMR）してくれます。

---

## 3. 環境構築

```bash
# プロジェクトを作成（Vite + React テンプレート）
npm create vite@latest gw-weather-app -- --template react
cd gw-weather-app

# 依存パッケージをインストール
npm install

# Three.js を追加
npm install three

# OpenWeatherMap の API キーを .env に記述
echo "VITE_WEATHER_API_KEY=あなたのAPIキー" > .env
```

> **OpenWeatherMap の無料 API キー取得方法**
> 1. https://openweathermap.org/api にアクセスしてアカウントを作成
> 2. 「Current Weather Data」の無料プランに申し込む
> 3. マイページから API キーをコピー
> 4. アカウント登録から最長2時間ほどで有効になる

---

## 4. ファイル構成

```
src/
├── main.jsx                         # アプリのエントリーポイント
├── index.css                        # 全体に適用するリセットCSS
├── App.jsx                          # ルートコンポーネント
├── hooks/
│   └── useWeather.js                # 天気データ取得カスタムフック
├── components/
│   ├── WeatherDisplay.jsx           # 天気情報UIコンポーネント
│   ├── WeatherDisplay.module.css    # 天気情報のcss
│   ├── WeatherBackground.jsx        # Three.js背景コンポーネント
│   └── WeatherBackground.module.css # 天気情報のcss
└── three/
    └── effects.js                   # 天気別エフェクト関数群
```

---

## 5. エントリーポイント — `index.html` / `main.jsx`

### `index.html`

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

`id="root"` の `<div>` が React アプリの **マウント先** です。

### `main.jsx`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`createRoot` で React に「ここに描画してください」と指定し、`render` で最上位コンポーネント `App` を渡します。
`StrictMode` は開発中に潜在的なバグを検出してくれるラッパーです（本番ビルドでは影響なし）。

---

## 6. グローバルスタイル — `index.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;        /* スクロールバーを消す */
}

#root {
  width: 100vw;
  height: 100vh;           /* 画面全体を使う */
}
```

Three.js のキャンバスで画面全体を埋めるため、`margin: 0` と `overflow: hidden` が重要です。

---

## 7. 天気データの取得 — `useWeather.js`

このファイルでは **カスタムフック** と **ユーティリティ関数** の 2 つを定義しています。

### カスタムフックとは

`use` で始まる関数で、React の組み込みフック（`useState` など）を組み合わせたロジックをまとめたものです。
コンポーネントから「データ取得の詳細」を切り離せるため、コードが読みやすくなります。

### `useWeather` フック

```js
import { useState, useEffect } from 'react'

export function useWeather(apiKey) {
  const [weather, setWeather] = useState(null)    // 取得した天気データ
  const [loading, setLoading] = useState(true)    // 読み込み中フラグ
  const [error,   setError]   = useState(null)    // エラーメッセージ

  useEffect(() => {
    // ブラウザのGeolocation APIで現在地を取得
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ja`
          )
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(`HTTP ${res.status}: ${body.message ?? res.statusText}`)
          }
          const data = await res.json()
          setWeather(data)
        } catch (e) {
          setError(e.message)
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('位置情報の取得が拒否されました')
        setLoading(false)
      }
    )
  }, [apiKey])  // apiKey が変わったときだけ再実行

  return { weather, loading, error }
}
```

**ポイント解説**

| フック | 役割 |
|--------|------|
| `useState` | コンポーネント内で変化するデータ（State）を保持する |
| `useEffect` | コンポーネントが画面に表示されたタイミングなどで副作用処理を行う |

`useEffect` の第 2 引数（依存配列）に `[apiKey]` を渡すと、「`apiKey` が変わったときだけ再実行」という意味になります。空配列 `[]` にすると「マウント時に 1 回だけ実行」です。

**OpenWeatherMap API のクエリパラメータ**

| パラメータ | 意味 |
|-----------|------|
| `lat` / `lon` | 緯度 / 経度 |
| `appid` | API キー |
| `units=metric` | 温度を摂氏で取得 |
| `lang=ja` | 天気の説明を日本語で取得 |

### `getWeatherCategory` 関数

```js
export function getWeatherCategory(weatherId) {
  if (weatherId >= 200 && weatherId < 300) return 'thunderstorm'
  if (weatherId >= 300 && weatherId < 400) return 'drizzle'
  if (weatherId >= 500 && weatherId < 600) return 'rain'
  if (weatherId >= 600 && weatherId < 700) return 'snow'
  if (weatherId >= 700 && weatherId < 800) return 'mist'
  if (weatherId === 800)                   return 'clear'
  if (weatherId > 800)                     return 'clouds'
  return 'clear'
}
```

OpenWeatherMap は天気を数値 ID で表します（例：雨は 500〜599）。
この関数で `'rain'` のような内部カテゴリ文字列に変換し、Three.js エフェクトの選択に使います。

---

## 8. 天気情報の表示 — `WeatherDisplay.jsx`

```jsx
import styles from './WeatherDisplay.module.css'

function WeatherDisplay({ weather }) {
  const { name, main, weather: conditions, wind } = weather
  const iconUrl = `https://openweathermap.org/img/wn/${conditions[0].icon}@2x.png`

  return (
    <div className={styles.container}>
      <h1 className={styles.city}>{name}</h1>
      <img src={iconUrl} alt={conditions[0].description} className={styles.icon} />
      <p className={styles.description}>{conditions[0].description}</p>
      <p className={styles.temp}>{Math.round(main.temp)}°C</p>
      <div className={styles.details}>
        <span>体感 {Math.round(main.feels_like)}°C</span>
        <span>湿度 {main.humidity}%</span>
        <span>風速 {wind.speed} m/s</span>
      </div>
    </div>
  )
}

export default WeatherDisplay
```

### Props（プロパティ）とは

コンポーネントが親から受け取るデータです。関数の引数と同じイメージです。
`weather` オブジェクトから必要なデータを **分割代入** で取り出しています。

```js
const { name, main, weather: conditions, wind } = weather
//     ↑市名  ↑気温など  ↑天気配列(変数名変更) ↑風
```

### `WeatherDisplay.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  user-select: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 2rem 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.city {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.icon {
  width: 100px;
  height: 100px;
}

.description {
  font-size: 1.2rem;
  margin-bottom: 0.4rem;
  text-transform: capitalize;
}

.temp {
  font-size: 5rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 1rem;
}

.details {
  display: flex;
  gap: 1.5rem;
  font-size: 1rem;
  opacity: 0.9;
}
```

Reactではcssを.module.cssと書きます。

---

## 9. Three.js エフェクト — `effects.js`

### Three.js の基本概念

Three.js で何か描くには最低 3 つの要素が必要です。

```
Scene（シーン）  ← 3D空間。ここにオブジェクトを追加する
Camera（カメラ） ← どこからシーンを見るかを決める
Renderer（レンダラー） ← シーンをcanvasに描画する
```

オブジェクトは次のように作ります。

```
Geometry（形状）  + Material（質感・色）  = Mesh（描画されるオブジェクト）
```

ライブラリのインストール
```js
import * as THREE from 'three'
```

---

### 雨エフェクト `createRain`

```js
export function createRain(scene) {
  const count = 3000
  const positions = new Float32Array(count * 2 * 3)
  // LineSegmentsには、1本あたり始点+終点の2頂点、各頂点はx/y/zの3成分が必要

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 20
    const y = Math.random() * 20
    const z = (Math.random() - 0.5) * 10
    // 線の始点
    positions[i * 6]     = x
    positions[i * 6 + 1] = y
    positions[i * 6 + 2] = z
    // 線の終点 (少し斜めに下)
    positions[i * 6 + 3] = x - 0.05
    positions[i * 6 + 4] = y - 0.35
    positions[i * 6 + 5] = z
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.55 })
  const rain = new THREE.LineSegments(geometry, material)
  scene.add(rain)

  function animate() {
    const pos = rain.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 6 + 1] -= 0.2   // 始点Y を下に
      pos[i * 6 + 4] -= 0.2   // 終点Y を下に
      if (pos[i * 6 + 1] < -5) {
        const newY = 15 + Math.random() * 5
        pos[i * 6 + 1] = newY
        pos[i * 6 + 4] = newY - 0.35
      }
    }
    rain.geometry.attributes.position.needsUpdate = true  // GPU に変更を通知
  }

  return { mesh: rain, animate }
}
```

**ポイント**

- `LineSegments` は「頂点 2 つで 1 本の線」を大量に描く Three.js のクラスです
- アニメーションは `animate()` で毎フレーム Y 座標を下げ、画面外に出たら上に戻すループです
- `needsUpdate = true` を忘れると GPU 側のバッファが更新されません

---

### 雪エフェクト `createSnow`

```js
export function createSnow(scene) {
  // Canvas で雪片テクスチャを動的に生成
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0,   'rgba(255,255,255,1)')   // 中心：不透明
  grad.addColorStop(0.5, 'rgba(255,255,255,0.8)')
  grad.addColorStop(1,   'rgba(255,255,255,0)')   // 外縁：透明
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(32, 32, 32, 0, Math.PI * 2); ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)

  // 雪片を配置
  const count = 2000
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = Math.random() * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    map: texture,
    size: 0.25,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })

  const snow = new THREE.Points(geometry, material)
  scene.add(snow)

  function animate() {
    const pos = snow.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 0.03
      pos[i * 3]     += Math.sin(Date.now() * 0.001 + i) * 0.002
      if (pos[i * 3 + 1] < -5) pos[i * 3 + 1] = 15
    }
    snow.geometry.attributes.position.needsUpdate = true
  }

  return { mesh: snow, animate }
}
```

**ポイント**

- `CanvasTexture` を使うと、Canvas 2D API で描いた絵をそのままテクスチャにできます
- `Points`（点群）は大量の点を効率よく描画する Three.js のクラスです
- `animate` 内で `Math.sin` を使うことで、雪が左右に揺れるような動きを実現しています

---

### 晴れエフェクト `createClear`

```js
export function createClear(scene) {
  const sunGeo = new THREE.SphereGeometry(0.9, 32, 32)
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe066 })
  const sun = new THREE.Mesh(sunGeo, sunMat)
  sun.position.set(3.5, 3, -2)
  scene.add(sun)

  // 中心から外に向かって透明になるグラデーションで光彩テクスチャを生成
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = 128
  glowCanvas.height = 128
  const ctx = glowCanvas.getContext('2d')
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0,   'rgba(255,240,100,0.8)')
  grad.addColorStop(0.4, 'rgba(255,220,50,0.3)')
  grad.addColorStop(1,   'rgba(255,200,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glowCanvas),
    transparent: true,
    depthWrite: false,
  }))
  glow.scale.set(6, 6, 1)
  glow.position.copy(sun.position)
  scene.add(glow)

  let t = 0
  function animate() {
    t += 0.02
    const pulse = 1 + Math.sin(t) * 0.04
    sun.scale.setScalar(pulse)
    glow.scale.set(6 * pulse, 6 * pulse, 1)
  }

  return { mesh: sun, animate }
}
```

**ポイント**

- `SphereGeometry(半径, 経度分割数, 緯度分割数)` で球を作ります
- `Sprite` はカメラに常に正面を向くオブジェクトです。光彩・UI アイコンに便利です
- `Math.sin(t)` で `t` を毎フレーム増やすと、滑らかな往復アニメーションになります

---

### 曇りエフェクト `createClouds`

複数の円を重ねた Canvas テクスチャを `Sprite` に貼り、18 個の雲を配置して右方向にゆっくり流します。

```js
export function createClouds(scene) {
  // 複数の円を重ねてモコモコした雲シルエットを描く
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  // 小さな円を並べて雲の輪郭を作る
  const puffs = [
    { x: 80,  y: 80, r: 50 },
    { x: 128, y: 65, r: 60 },
    { x: 176, y: 80, r: 50 },
    { x: 100, y: 95, r: 42 },
    { x: 155, y: 95, r: 42 },
  ]
  puffs.forEach(({ x, y, r }) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0,   'rgba(255,255,255,1)')
    g.addColorStop(0.6, 'rgba(240,240,250,0.9)')
    g.addColorStop(1,   'rgba(220,225,235,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })
  const texture = new THREE.CanvasTexture(canvas)

  // 複数の Sprite を配置して雲の群れを作る
  const sprites = []
  for (let i = 0; i < 18; i++) {
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55 + Math.random() * 0.35,
      depthWrite: false,
    })
    const sprite = new THREE.Sprite(mat)
    const w = 4 + Math.random() * 5
    sprite.scale.set(w, w * 0.55, 1)
    sprite.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 5 + 1,
      -2 - Math.random() * 3,
    )
    scene.add(sprite)
    sprites.push(sprite)
  }

  function animate() {
    // 右から左へゆっくり流す。画面外に出たら反対側に戻す
    sprites.forEach(s => {
      s.position.x += 0.004 + s.scale.x * 0.0003
      if (s.position.x > 14) s.position.x = -14
    })
  }

  return { mesh: sprites[0], animate }
}
```

---

### 雷雨エフェクト `createThunderstorm`

雨エフェクトに加え、画面全体を覆う半透明の白いプレーンをランダムに光らせて稲妻を表現します。

```js
export function createThunderstorm(scene) {
  const rain = createRain(scene)
  let flashTimer = 0

  // 画面全体を覆う白いプレーンを閃光として使う
  // MeshBasicMaterial は照明に依存しないので opacity を直接制御できる
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const flashPlane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), flashMat)
  flashPlane.position.z = 4  // カメラの手前に配置
  scene.add(flashPlane)

  function animate() {
    rain.animate()
    flashTimer++
    if (flashTimer > 100 && Math.random() > 0.97) {
      flashMat.opacity = 0.6 + Math.random() * 0.3
      flashTimer = 0
    } else {
      flashMat.opacity *= 0.8  // 徐々に透明に戻る
    }
  }

  return { mesh: rain.mesh, animate }
}
```

`opacity *= 0.8` は「指数関数的減衰」で、最初は急速に暗くなり、徐々にゆっくりになる自然なフェードを作ります。

---

### 霧エフェクト `createMist`

```js
export function createMist(scene) {
  scene.fog = new THREE.FogExp2(0x8899aa, 0.15)

  const count = 500
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0xaabbcc,
    size: 0.3,
    transparent: true,
    opacity: 0.3,
  })

  const mist = new THREE.Points(geometry, material)
  scene.add(mist)

  function animate() {
    mist.rotation.y += 0.0005
  }

  return { mesh: mist, animate }
}
```

`FogExp2` を使うとカメラから離れるほど指数的に霞む自然な霧が実現できます。

---

### エフェクトのファクトリ関数

```js
export function createEffect(category, scene) {
  switch (category) {
    case 'rain':
    case 'drizzle':    return createRain(scene)
    case 'snow':       return createSnow(scene)
    case 'clear':      return createClear(scene)
    case 'clouds':     return createClouds(scene)
    case 'thunderstorm': return createThunderstorm(scene)
    case 'mist':       return createMist(scene)
    default:           return createClear(scene)
  }
}
```

カテゴリ文字列を受け取って対応するエフェクトを返す **ファクトリパターン** です。
呼び出し側は `createEffect(category, scene)` と書くだけで済みます。

### 天気に応じて背景色を返す関数

```js
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
```

---

## 10. Three.js 背景コンポーネント — `WeatherBackground.jsx`

```jsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createEffect, getBackgroundColor } from '../three/effects'
import styles from './WeatherBackground.module.css'

function WeatherBackground({ category }) {
  const mountRef = useRef(null)   // DOMノードへの参照

  useEffect(() => {
    const mount = mountRef.current

    // --- Three.js のセットアップ ---
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(getBackgroundColor(category))

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)   // canvasをDOMに追加

    const effect = createEffect(category, scene)

    // --- アニメーションループ ---
    let animationId
    function loop() {
      animationId = requestAnimationFrame(loop)   // 次のフレームで自分を呼ぶ
      effect.animate()
      renderer.render(scene, camera)
    }
    loop()

    // --- リサイズ対応 ---
    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // --- クリーンアップ（コンポーネント破棄時に実行） ---
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      if (scene.fog) scene.fog = null
    }
  }, [category])   // category が変わるたびに Three.js を作り直す

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
}

export default WeatherBackground
```

### `useRef` とは

`useRef` は「React の再描画をまたいで値を保持する箱」です。
ここでは `mountRef.current` に `<div>` の DOM ノードが入り、Three.js のキャンバスをその中に追加します。

### `useEffect` のクリーンアップ

`useEffect` は `return` で関数を返すと、コンポーネントが**削除されるとき・再実行される前**にその関数を呼びます。
Three.js は GPU リソースを手動で解放する必要があるため、`renderer.dispose()` や `cancelAnimationFrame` をここで行います。

### `requestAnimationFrame`

ブラウザの描画タイミングに合わせてコールバックを呼ぶ Web API です（通常 60fps）。
`loop` 関数が自分自身を `requestAnimationFrame` に登録することでアニメーションが続きます。

### `WeatherBackground.module.css`
```css
.canvas {
  position: absolute;
  inset: 0;
}
```

---

## 11. アプリのルート — `App.jsx`

```jsx
import { useWeather, getWeatherCategory } from './hooks/useWeather'
import WeatherBackground from './components/WeatherBackground'
import WeatherDisplay from './components/WeatherDisplay'
import styles from './App.module.css'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

function App() {
  const { weather, loading, error } = useWeather(API_KEY)

  const category = weather ? getWeatherCategory(weather.weather[0].id) : 'clear'
  // デバック用
  // const category = 'thunderstorm'

  return (
    <div className={styles.root}>
      <WeatherBackground category={category} />
      <div className={styles.overlay}>
        {loading && <p className={styles.loading}>読み込み中...</p>}
        {error   && <p className={styles.error}>エラー: {error}</p>}
        {weather && <WeatherDisplay weather={weather} />}
      </div>
    </div>
  )
}

export default App
```

### App.module.css

```css
.root {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading {
  color: #fff;
  font-size: 1.5rem;
}

.error {
  color: #faa;
  font-size: 1.2rem;
}
```

`position: absolute` + `inset: 0` で要素が親の四方を埋め尽くします。
2 つの `absolute` 要素を重ねることで、Three.js の背景の上に UI を乗せています。

### 条件付きレンダリング

```jsx
{loading && <p>読み込み中...</p>}
{error   && <p>エラー: {error}</p>}
{weather && <WeatherDisplay weather={weather} />}
```

`&&` 演算子は「左側が truthy なら右側を返す」性質を使ったパターンです。
State の値によって表示する内容を切り替えています。

### 環境変数

`import.meta.env.VITE_WEATHER_API_KEY` は `.env` ファイルに書いた `VITE_WEATHER_API_KEY=xxx` を読み込みます。
`VITE_` プレフィックスを付けないとクライアントサイドに公開されないので注意してください。

---

## 12. 動かしてみよう

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173` を開き、位置情報の使用を許可すると天気が表示されます。

### 天気を手動で切り替えてテストする

`App.jsx` の `category` を直接書き換えると、API なしで各エフェクトを確認できます。

```js
// デバッグ用：任意のカテゴリを指定
const category = 'thunderstorm'  // 'rain' | 'snow' | 'clear' | 'clouds' | 'mist'
```

### 本番ビルド

```bash
npm run build   # dist/ フォルダに出力
npm run preview # ビルド結果をローカルでプレビュー
```

---

## まとめ — 各ファイルの役割

| ファイル | 役割 |
|---------|------|
| `main.jsx` | React アプリを DOM にマウント |
| `index.css` | 全体リセット＋フルスクリーン設定 |
| `App.jsx` | 天気取得→カテゴリ判定→背景と UI を合成 |
| `useWeather.js` | Geolocation + OpenWeatherMap API でデータ取得 |
| `WeatherDisplay.jsx` | 気温・湿度・風速を UI として表示 |
| `WeatherBackground.jsx` | Three.js をセットアップして背景アニメーションを描画 |
| `effects.js` | 天気カテゴリ別の Three.js エフェクト関数群 |

React でデータの流れを管理し、Three.js で視覚表現を担当する **役割分担** がこのアプリの設計の肝です。
