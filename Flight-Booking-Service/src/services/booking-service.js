const {StatusCodes} = require('http-status-codes');
const axios = require('axios');

const { BookingRepository } = require('../repositories');
const AppError = require('../utils/errors/app-error');
const db = require('../models');
const {ServerConfig}=require('../config')

const {Enums} = require('../utils/common');
const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

const bookingRepository=new BookingRepository();

async function createBooking(data){
  
    const transaction = await db.sequelize.transaction();
    try {
        const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
        const flightData = flight.data.data;
        if(data.noofSeats > flightData.totalSeats) {
            throw new AppError('Not enough seats available', StatusCodes.BAD_REQUEST);
        }
        const totalBillingAmount = data.noofSeats * flightData.price;
        const bookingPayload = {...data, totalCost: totalBillingAmount};

        //booking started
        const booking = await bookingRepository.createBooking(bookingPayload, transaction);

        //reduce seat number from flight
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`, {
            seats: data.noofSeats
        });
        await transaction.commit();
        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

}

async function makePayment(data) {
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails = await bookingRepository.get(data.bookingId, transaction);
        if(bookingDetails.status == CANCELLED) {
            throw new AppError('The booking has expired', StatusCodes.BAD_REQUEST);
        }
        // console.log(bookingDetails);
        const bookingTime = new Date(bookingDetails.createdAt);
        const currentTime = new Date();
        if(currentTime - bookingTime > 300000) {
            await cancelBooking(data.bookingId);
            throw new AppError('The booking has expired', StatusCodes.BAD_REQUEST);
        }
        if(bookingDetails.totalCost != data.totalCost) {
            throw new AppError('The amount of the payment doesnt match', StatusCodes.BAD_REQUEST);
        }
        if(bookingDetails.userId != data.userId) {
            throw new AppError('The user corresponding to the booking doesnt match', StatusCodes.BAD_REQUEST);
        }
        // we assume here that payment is successful
        await bookingRepository.update(data.bookingId, {status: BOOKED}, transaction);
        await transaction.commit();
        
    } catch(error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelBooking(bookingId){
     const transaction=await db.sequelize.transaction();  
     try {
        const bookingDetails = await bookingRepository.get(bookingId, transaction);
        if(bookingDetails.status == CANCELLED) {
           await transaction.commit();  
           return true;
        }
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`, {
            seats: bookingDetails.noofSeats,
            dec:0,
        });
        await bookingRepository.update(bookingId, {status: CANCELLED}, transaction);
        await transaction.commit();
        return true;

     } catch (error) {
        await transaction.rollback();
        throw error;
     }
}

async function cancelOldBookings() {
    try {
        const time = new Date( Date.now() - 1000 * 300 ); // time 5 mins ago
        const response = await bookingRepository.cancelOldBookings(time);
        
        return response;
    } catch(error) {
        console.log(error);
    }
}
module.exports={
    createBooking,
    makePayment,
    cancelOldBookings
}