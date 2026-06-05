const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone:{
    type : Number,
    required : true
  },

  service: {
    type: String,
    required: true
  },
  source: {
        type: String,
        enum: ['website', 'meta', 'google'],
        required: true
    },
    campaign: { 
        type: String 
    },
    keyword:{
      type:String
    },
    status: {
            type: String,
            enum: ['new', 'contacted', 'converted', 'lost'],
            default: 'new'
        },
        assignedTo: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'user' 
        },
        notes: { 
            type: String 
        }

}, {
  timestamps: true

});

module.exports = mongoose.model('Lead', leadSchema);
