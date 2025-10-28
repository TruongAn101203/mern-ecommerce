import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: [{
        productId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        size: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: {
            type: [String],
            required: true
        }
    }],
    address: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
    type: String,
    enum: ['Pending', 'Pending Payment', 'Processing', 'Delivered', 'Cancelled'],
    default: 'Pending'
    },

    paymentMethod: {
        type: String,
        enum: ['COD', 'VNPAY'],
        default: 'COD',
        required: true
    },
    payment: {
        type: Boolean,
        default: false,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
}, { timestamps: true });

const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default orderModel;

