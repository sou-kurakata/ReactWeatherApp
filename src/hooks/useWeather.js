import { useState, useEffect } from 'react';

export function useWeather(apiKey) {
    // https://ja.react.dev/reference/react/useState
    // useStateは非同期で状態を更新してくれる
    // 子供に説明するときはボタンを押したら勝手に変更してくれるくらいで良い
    // レファレンスに詳しく書いてあるが、変数と更新関数をセットで書くのは慣習で、()のなかは初期値
    const [weather, setWeather] = useState(null); // 取得して天気データ 
    const [loading, setLoading] = useState(true); // 読み込み中フラグ
    const [error, setError] = useState(null); // エラーメッセージ

    // useEffectはAPI通信などのReactの外の処理が起きた時に実行される関数
    useEffect(() => {
        // ブラウザのGeolocation APIで現在地を取得
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ja`
                    )
                    if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(`HTTP ${res.status}: ${body.message ?? res.statusText}`);
                    }
                    const data = await res.json();
                    setWeather(data);
                } catch (e) {
                    setError(e.message);
                } finally {
                    setLoading(false); 
                }
 
            },
            () => {
                setError('位置情報の取得が拒否されました');
                setLoading(false);
            }
        )
    },[apiKey]) // APIキーが変わったときに再実行
    return { weather, loading, error };
}

// APIで返ってくる天気の数字をカテゴリーに分類する関数
// 400番台は未使用
export function getWeatherCategory(weatherID) {
    if (weatherID >= 200 && weatherID < 300) return 'thunderstorm';
    if (weatherID >= 300 && weatherID < 400) return 'drizzle';
    if (weatherID >= 400 && weatherID < 600) return 'rain';
    if (weatherID >= 600 && weatherID < 700) return 'snow';
    if (weatherID >= 700 && weatherID < 800) return 'mist';
    if (weatherID === 800) return 'clear';
    if (weatherID > 800) return 'clouds';
    return 'clear';
}