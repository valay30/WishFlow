import crypto from 'crypto';
import dotenv from 'dotenv';
import { razorpay } from '../config/razorpay.js';
import { supabase } from '../config/supabase.js';

dotenv.config();

export const createOrder = async (req, res) => {
    try {
        const options = {
            amount: 100 * 100, // 100 Rupees in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}` // max 40 chars
        };
        const order = await razorpay.orders.create(options);
        res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
};

export const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        try {
            // Update user metadata in Supabase to mark them as premium
            const { data, error } = await supabase.auth.admin.updateUserById(
                userId,
                { user_metadata: { is_premium: true } }
            );
            if (error) throw error;
            res.json({ success: true, message: 'Payment verified successfully and user upgraded.' });
        } catch (error) {
            console.error('Error updating premium status:', error);
            res.status(500).json({ success: false, error: 'Database update failed' });
        }
    } else {
        res.status(400).json({ success: false, message: 'Invalid Signature' });
    }
};
