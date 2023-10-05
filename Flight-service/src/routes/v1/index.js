const express=require('express');

const {InfoController}=require('../../controllers');
const airplanesRoutes=require('./airplane-routes');
const cityRoutes=require('./city-routes');
const airportRoutes = require('./airport-routes');
const flightRoutes = require('./flight-routes');

const router=express.Router();

router.use('/airplanes',airplanesRoutes);
router.use('/cities', cityRoutes);
router.use('/airports', airportRoutes);
router.use('/flights', flightRoutes);

router.get('/info',InfoController.info);

module.exports=router;