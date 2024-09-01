import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://tusharsinghota9650:8743008308@cluster0.z4aqacn.mongodb.net/food-del').then(() => { console.log('DB Connnected') })
}

