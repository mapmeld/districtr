// eventRead.js
import mongoose from 'mongoose'
// Load the server
import db from './server'
// Load the Product Model
import Event from './eventModel'
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  try {
    let findParams = {};
    if (event.queryStringParameters.id) {
        findParams._id = event.queryStringParameters.id;
    } else if (event.queryStringParameters.shortcode) {
        findParams.shortcode = event.queryStringParameters.shortcode;
    }
    const events = await Event.find(findParams),
          response = {
            msg: "Event(s) successfully found",
            data: events
          }

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    }

  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({msg: err.message})
    }
  }
}
