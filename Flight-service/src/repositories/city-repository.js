const {City} = require("../models");
const CrudRepository = require("./crud-repository");

class CityRepository extends CrudRepository{
    constructor(data){
        super(City);
    }
}

module.exports=CityRepository;