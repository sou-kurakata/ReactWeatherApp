import styles from './WeatherDisplay.module.css';

function WeatherDisplay({ weather}) {
    // jsの分割代入の書き方
    const { name, main, weather: conditions, wind } = weather;
    const iconUrl = `https://openweathermap.org/img/wn/${conditions[0].icon}@2x.png`;

    return (
        // styles.クラスの名前で指定
        // あとはhtmlと同じ書き方
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

export default WeatherDisplay;