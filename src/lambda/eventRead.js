// planRead.js
import mongoose from 'mongoose';
import db from './server';
import Plan from './planModel';

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  try {
    const eventCode = event.queryStringParameters.event;
    const myHost = event.queryStringParameters.hostname;
    if (!eventCode.trim().length) {
        return {
            statusCode: 301,
            body: JSON.stringify({
                msg: "Set event= parameter"
            })
        };
    }

    const plans = await Plan.find({
        eventCode: eventCode,
        hostname: myHost
    });
    return {
        statusCode: 200,
        body: JSON.stringify({
            msg: "Plan(s) successfully found",
            plans: plans
        })
    };
  } catch (err) {
      console.log(err) // output to netlify function log
      return {
          statusCode: 500,
          body: JSON.stringify({msg: err.message})
      }
  }
};
