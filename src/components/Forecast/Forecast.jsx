
const Forecast = (props) => {

  console.log('Data: ', props.weatherData)


  return (
    <main>
      Forecast component

      {props.weatherData.name && (
        <div>
          Weather for {props.weatherData.name}
            <ul>
              {props.weatherData.weather.map(timeframe => (
                <li key={timeframe._id}>
                  <h4>{timeframe.name}:</h4>
                  {timeframe.detailedForecast}
                </li>
              ))}
            </ul>
        </div>
      )}
      

    </main>
  );
};

export default Forecast;