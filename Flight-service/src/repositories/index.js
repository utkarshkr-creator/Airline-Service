const AirplaneRepository = require("./airplane-repository")
const CrudRepository = require("./crud-repository")
const CityRepository=require("./city-repository")

module.exports={
    AirplaneRepository,
    CrudRepository,
    CityRepository,
    AirportRepository: require('./airport-respository'),
    FlightRepository: require('./flight-repository')
}