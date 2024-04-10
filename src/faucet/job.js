import Web3 from 'web3'
import { Faucet } from "../database/connect.js"
const privateKey = process.env.PRIAVTE_KEY
const testnetRPC = process.env.TESTNET_RPC
const sendAmout = process.env.SEND_AMOUNT
const channelId = process.env.CHANNEL_ID_FAUCET

const web3  = new Web3(testnetRPC)
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
const amountToSend = web3.utils.toWei(sendAmout, 'ether');

let jobRunning = false

async function sendEth(walletAddress) {
    try {
        const txObject = {
            from: account.address,
            to: walletAddress,
            value: amountToSend,
            // gasLimit: web3.utils.toHex('500'), // Gas limit
            // gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')) // Gas price
            gas: web3.utils.toHex(3000000), 
            gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()), 
        };
        const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
        const tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Transaction hash:', tx.transactionHash);
        return {status: true, hash: tx.transactionHash}
    } catch (error) {
        console.error('Error sending ETH:', error);
        return {status: false, hash: ""}
    }
}

export async function sendEthProcess(client){
    if(jobRunning)
        return
    jobRunning = true
    const faucet = await Faucet.findOneAndUpdate({ status: "initial" }, {status: "processing"}, { new: true }, { sort: { createdAt: -1 } });
    if(faucet){
        const {status, hash} = await sendEth(faucet.walletAddress)
        console.log(`send at ${hash} ${faucet}`)
        if(status){
            const channel = client.channels.cache.get(channelId);
            channel.send(`<@${faucet.userId}> ${sendAmout} ETH sent to your wallet: ${process.env.TESTNET_RPC}{/tx/${hash}`, { reply: channelId });
            faucet.status = "completed"
        }else{
            faucet.status = "initial"
        }
        faucet.save()
    }
    jobRunning = false
}