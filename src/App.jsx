import { useWeather, getWeatherCategory } from './hooks/useWeather'
import WeatherBackground from './components/WeatherBackground'
import WeatherDisplay from './components/WeatherDisplay'
import styles from './App.module.css'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

function App() {
  const { weather, loading, error } = useWeather(API_KEY);

  const category = weather ? getWeatherCategory(weather.weather[0].id) : 'clear';
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
