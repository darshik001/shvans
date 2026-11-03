
const { razorpay } = require("../../../config/razorpay.config")
const { CustomeError } = require("../../../middleware/globelError")
const orderModel = require("../../../model/order.model")
const productModel = require('../../../model/product.model')
const { ShiprocketCancel, ShiproketReturnCreate } = require("../../../services/shiproketapis")

exports.UserGetOrder = async (req, res, next) => {
    try {
        const userId = req.user._id
        console.log(userId)
        const orders = await orderModel.find({ userId: userId })

        return res.status(200).json({ success: true, message: 'Order Get Successfully', orders })
    } catch (error) {
        return next(error)
    }
}


exports.CanceleOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id

        let order = await orderModel.findById(orderId)

        if (!order) {
            return next(CustomeError(404, "Order Not Found"))
        }

        if (!["pending", "accepted", "processing"].includes(order.status)) {
            return next(CustomeError(400, "Order Not Canceled This Stage"));
        }

        try {

            const canceleOrderResposn = await ShiprocketCancel(order.shipmentData.shiprocket_order_id)
        } catch (error) {
            return next(error.message)
        }


        const refundData = {
            method: "cod",
            status: "not_required",
            refundId: "",
        }
        if (order.paymentData.method == "prepaid" && order.paymentData.status == "paid") {
            // razorpay refund

            const option = {
                amount: order.total * 100,
                speed: 'normal',
                receipt: `RE_${order.orderNumber}`,
                notes: {
                    reason: 'Customer requested cancellation',
                    order_item_id: order.orderNumber
                }
            }

            const refund = await razorpay.payments.refund(order.paymentData.razorpay_payment_id, option)
            refundData.method = "prepaid",
                refundData.status = "pending"
            refundData.refundId = refund.id
        }
        if (order.paymentData.method == "cod") {
            order = await orderModel.findByIdAndUpdate(order._id, { $set: { status: "cancelled", refundData, "paymentData.status": "failed" } }, { returnDocument: 'after' })

        } else {

            order = await orderModel.findByIdAndUpdate(order._id, { $set: { status: "cancelled", refundData, "paymentData.status": "refunded" } }, { returnDocument: 'after' })
        }


        return res.status(200).json({ success: true, message: "Order Cancele Successfully", order })

    } catch (error) {
        return next(error)
    }
}


exports.ReturnOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id
        const user = req.user

        const {bankDetails,reason}  =req.body || {}

       if (typeof reason !== "string" || !reason.trim()) {
    return next(CustomeError(422, "Return reason is required"));
}
        let order = await orderModel.findById(orderId)

        if (!order) {
            return next(CustomeError(404, "Order Not Found"))
        }

        if (order.type == "return") {
            return next(CustomeError(400, "Order is already in the return process"))
        }

        if (order.status != "delivered") {
            return next(CustomeError(400, "Order Cannot Return In This Stage"))
        }





        const deliveredAt = new Date(order.completeAt);
        const currentDate = new Date();

        const returnDeadline = new Date(deliveredAt);
        returnDeadline.setDate(returnDeadline.getDate() + 7);

        if (currentDate <= returnDeadline) {
            if (order.paymentData.method == "cod" && order.paymentData.status == 'paid' && !bankDetails) {
                return next(CustomeError(422, 'bankDetails is required'))
            }

            const productsskus = order.items.map((p) => p.sku)
            const products = await productModel.find({ sku: { $in: productsskus } });
            const order_items = order.items.map((p) => {
                return {
                    "name": p.name,
                    "qc_enable": true,
                    "qc_product_name": p.name,
                    "sku": p.sku,
                    "units": p.quantity,
                    "selling_price": p.price,
                    "discount": 0,
                    "qc_brand": "shvans",
                    "qc_product_image": p.image_url
                }
            })

            let length = 0;
            let height = 0;
            let breadth = 0;
            let weight = 0;
            let count = 0;

            order.items.forEach((item) => {
                const product = products.find((p) => p.sku === item.sku);

                if (!product) return;

                weight += product.packing.weight * item.quantity;

                length += product.packing.length;
                breadth += product.packing.breadth;
                height += product.packing.height;

                count++;
            });

            if (count > 0) {
                length = length / count;
                breadth = breadth / count;
                height = height / count;
            }



            const returnApiData = {
                order_id: order.orderNumber,
                order_date: new Date(order.createdAt).toISOString().slice(0, 16).replace("T", " "),
                payment_method: "PREPAID",
                pickup_customer_name: order.address.name,
                pickup_phone: user.phone,
                pickup_email: user.email,
                pickup_address: order.address.line1,
                pickup_address_2: order.address.line2,
                pickup_city: order.address.city,
                pickup_pincode: order.address.zipcode,
                pickup_state: order.address.state,
                pickup_country: "India",


                shipping_customer_name: process.env.SELLER_NAME,
                shipping_email: process.env.SELLER_EMAIL,
                shipping_phone: process.env.SELLER_PHON,
                shipping_address: process.env.SELLER_ADDRES_1,
                shipping_address_2: process.env.SELLER_ADDRES_2,
                shipping_city: process.env.SELLER_CITY,
                shipping_state: process.env.SELLER_STATE,
                shipping_country: process.env.SELLER_COUNTRY,
                shipping_pincode: process.env.SELLER_PINCODE,

                order_items,
                sub_total: order.totalAmount,
                total_discount: 0,
                length: length,
                breadth: breadth,
                height: height,
                weight: weight,
                request_pickup: true
            }

            const ReturnOrder = await ShiproketReturnCreate(returnApiData)

            if (!ReturnOrder.status || !ReturnOrder.payload?.awb_generated) {
               await ShiprocketCancel(ReturnOrder.payload.order_id)
                return next(CustomeError(400, "Unable to process the return request right now. Please try again later"))
            }




            const returnData = {
                order_id: ReturnOrder.payload.order_id,
                shipment_id: ReturnOrder.payload.shipment_id,
                awb: ReturnOrder.payload.awb_code,
                courier_id: ReturnOrder.payload.courier_company_id,
                courier_name: ReturnOrder.payload.courier_name,
                pickup_scheduled_date: ReturnOrder.payload.pickup_scheduled_date,
                status: "pending",
                reason: reason,
            }

            const refundData = {
                method: order.paymentData.method === "cod" ? "cod" : "prepaid",
                status: "pending"
            };

            if (order.paymentData.method === "cod") {
                refundData.accountDetails = bankDetails;
            }



            order = await orderModel.findByIdAndUpdate(order._id, { $set: { refundData, returnData, type: "return" } })


            return res.status(200).json({ success: true, message: "Return Created Successfully" })


        } else {
            return next(CustomeError(400, "Return Period Expired"))
        }
    } catch (error) {
        return next(error)
    }
}