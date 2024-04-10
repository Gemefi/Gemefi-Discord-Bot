import { Faucet } from "../database/connect.js"

async function eligibleFaucet(userId) {
    try {
        const userData = await Faucet.findOne(
            { userId: userId , status: {$in: ["completed", "processing"]}}
        ).sort({ createdAt: -1 }).select('createdAt').lean().exec();
        console.log("test: ", userData)
        if (!userData) {
            return { allow: true, message: "Wait a minutes. You will recieve the notofication when it's sent"}
        }
        const createdAt = userData.createdAt;
        createdAt.setHours(createdAt.getHours() + 12);

        const currentTime = new Date();
        const timeDifference =  createdAt.getTime() - currentTime.getTime();
        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
        if (hours > 12) {
            return { allow: true, message: "Wait a minutes. You will recieve the notofication when it's sent"}
        } else {
            return { allow: false, message: `Come back in ${hours}h ${minutes}m ${seconds}s`};
        }
    } catch (error) {
        console.error("Error checking user createdAt:", error);
        return { allow: false, message: "System errors[500]. Please come back later"}
    }
}

export async function processFaucet(
    userName,
    userId,
    walletAddress
){
    const {allow, message} = await eligibleFaucet(userId)
    if(allow){
        const faucet = new Faucet(
            {
                userName: userName,
                userId: userId,
                walletAddress: walletAddress,
            }
        )
        faucet.save()
        .then(result => {
            console.log('Data saved successfully:', result);
        })
        .catch(error => {
            console.error('Error saving data:', error);
        });
    }
    return message
}