import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Placing user order for frontend
const placeOrder = async (req, res) => {
    const frontend_url = "http://127.0.0.1:5174/";

    try {
        // Create a new order in the database
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        });

        // Save the new order
        await newOrder.save();

        // Clear the user's cart after placing the order
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Map the items to Stripe's line items format
        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(item.price * 100) // Convert to paise and ensure it's an integer
            },
            quantity: item.quantity
        }));

        // Add delivery charges
        line_items.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: 2 * 100, // Assuming a delivery charge of 2 INR
            },
            quantity: 1
        });

        // Create a Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Specify the payment methods you want to accept
            line_items: line_items,
            mode: 'payment',
            success_url: `${frontend_url}verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}verify?success=false&orderId=${newOrder._id}`,
        });

        // Send the session URL to the frontend
        res.json({ success: true, success_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error });
    }
};

const verifyOrder = async (req,res) =>{

    const {orderId,success} = req.body;
    try {
        console.log(success,'succes')
        if(success == "true"){
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({success:true,message:"Paid"})
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false,message:"Not Paid"});
            console.log(success,'succes')
    
    }
    } catch (error) {
        console.log(error)
        res.json({success:false,message:'Error'})
        
    }




}

// user orders for frontend
const userOrders = async (req,res) =>{

    try {

        const orders = await orderModel.find({userId:req.body.userId});
        res.json({success:true,data:orders})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})

    }

}

// listing ordes for admin panel

const listOrders = async (req,res) => {

    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders});
    } catch (error) {
       console.log(error)   
       res.json({success:false,message:"Error"});
    }

}


//api for updating orders status

const updateStatus = async (req,res) => {

    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        res.json({success:true,message:"Status Updated"})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:"Error"})
    }

}


export { placeOrder, verifyOrder ,userOrders,listOrders,updateStatus};