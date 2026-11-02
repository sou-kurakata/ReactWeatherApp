# ReactWeatherApp

ブラウザの位置情報から現在地の天気を取得し、天気に合わせた Three.js のアニメーション背景(晴れ・曇り・雨・雪・雷雨・霧など)を表示する Web アプリ。
React と Three.js の学習用教材として作成した。作り方の解説は [TUTORIAL.md](./TUTORIAL.md) にまとめている。

## 使用技術

- React 19 / Vite
- Three.js
- OpenWeatherMap API

## 動かし方

```bash
npm install
echo "VITE_WEATHER_API_KEY=あなたのAPIキー" > .env
npm run dev
```

API キーは OpenWeatherMap で無料で取得できる(手順は TUTORIAL.md の「環境構築」)。
