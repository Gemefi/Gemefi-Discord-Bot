import mongoose from 'mongoose';

const { Schema } = mongoose;

const dbConectionString = process.env.DB_CONNECTIONS_STRING

mongoose.connect(dbConectionString);

const faucetSchema = new Schema({
    userName: String,
    userId: String,
    walletAddress: String,
    status: {
      type: String,
      default: "initial"
    }
}, { timestamps: true }, { strictQuery: false });

export const Faucet = mongoose.model('faucet', faucetSchema);