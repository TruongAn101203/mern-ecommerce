import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const placeOrder = async (req, res) => {
    try {
        const { items, amount, address, method = 'COD' } = req.body;
        
        // Validate required fields
        if (!items || !items.length) {
            return res.status(400).json({
                success: false,
                message: "No items in the order"
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }

        if (!address || !address.fullName || !address.phone || !address.address) {
            return res.status(400).json({
                success: false,
                message: "Please provide complete delivery information"
            });
        }

        try {
            // Create order data without _id to let MongoDB generate it
            const orderData = {
                userId: req.user.id,
                items: items.map(item => ({
                    // Make sure we're not including any _id in the items
                    productId: item._id || item.productId, // Handle both cases
                    name: item.name,
                    price: item.price,
                    size: item.size,
                    quantity: item.quantity,
                    image: item.image
                })),
                address: {
                    fullName: address.fullName,
                    email: address.email || '',
                    phone: address.phone,
                    address: address.address
                },
                amount: amount,
                paymentMethod: method.toUpperCase(),
                payment: method.toUpperCase() === 'COD', // Only mark as paid if COD
                status: method.toUpperCase() === 'VNPAY' ? 'Pending Payment' : 'Order Placed',
                date: new Date()
            };
            
            // Remove any _id that might have been included in the request
            delete orderData._id;

            const newOrder = new orderModel(orderData);
            await newOrder.save();

            // Only clear cart for COD orders or after successful VNPAY payment
            if (method.toUpperCase() === 'COD') {
                await userModel.findByIdAndUpdate(
                    req.user.id, 
                    { $set: { cartData: {} } },
                    { new: true }
                );
            }

            res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order: newOrder
            });

        } catch (validationError) {
            console.error("Validation error:", validationError);
            return res.status(400).json({
                success: false,
                message: validationError.message || "Validation error"
            });
        }

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}

const placeOrderVnpay = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find();
        res.json({success: true, orders});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Failed to get orders"});
    }
}

const userOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching orders for user ID:', userId);
        
        // First, check if the user exists
        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Find all orders for this user
        const orders = await orderModel.find({ userId: userId.toString() })
            .sort({ createdAt: -1 });
        
        console.log(`Found ${orders.length} orders for user ${userId}:`, orders);
        
        // If no orders found, try alternative field names (for backward compatibility)
        if (orders.length === 0) {
            console.log('No orders found with userId, trying alternative fields...');
            const altOrders = await orderModel.find({
                $or: [
                    { 'user._id': userId },
                    { 'user': userId },
                    { 'userId': { $exists: false } } // In case userId field is missing
                ]
            }).sort({ createdAt: -1 });
            
            console.log(`Found ${altOrders.length} orders with alternative fields`);
            return res.json({ success: true, orders: altOrders });
        }
        
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error in userOrders:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to get orders", 
            error: error.message 
        });
    }
}

// Update order status
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: "Order ID and status are required"
            });
        }

        // Validate status value
        const validStatuses = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            message: "Order status updated successfully",
            order: updatedOrder
        });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update order status"
        });
    }
};

export {placeOrder, placeOrderVnpay, allOrders, userOrders, updateStatus};