import { useState, useEfect } from 'react';

export function useWeather() {
    // https://ja.react.dev/reference/react/useState
    // useSateは非同期で状態を更新してくれる
    // 子供に説明するときはボタンを押したら勝手に変更してくれるくらいで良い
    // レファレンスに詳しく書いてあるが、変数と更新関数をセットで書くのは慣習で、()のなかは初期値
    const [weather, setWeather] = useState(null); // 取得して天気データ 
    const [loading, setLoading] = useState(ture); // 読み込み中フラグ
    const [error, setError] = useState(null); // エラーメッセージ

    // useEfectはAPI通信などのReactの外の処理が起きた時に実行される関数
    useEfect(() => {
        // ブラウザのGeolocation APIで現在地を取得
        navigation.geolocation.getCurrentPosition(
            async (positon) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fectch(
                        'https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=j'
                    )
                    if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error('HTTP ${res.status}: ${body.message ?? res.statusText}');
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
                setLoading('false');
            }
        )
    },[apikey]) // APIキーが変わったときに再実行
    return { weather, loading, error };
}