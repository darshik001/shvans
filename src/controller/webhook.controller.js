const { razorpay } = require("../config/razorpay.config");
const { CustomeError } = require("../middleware/globelError");
const orderModel = require("../model/order.model");


exports.RazorpayRefundWebhook = async (req, res, next) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        const signature = req.headers["x-razorpay-signature"];

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: "Razorpay webhook signature missing",
            });
        }

        // req.body is currently an Object
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

        const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

        if (expectedSignature !== signature) {
            return res.status(401).json({
                success: false,
                message: "Invalid Razorpay webhook signature",
            });
        }

        const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString("utf8")) : req.body;


        if (body.event === 'refund.created') {
            await orderModel.findOneAndUpdate({ "paymentData.razorpay_payment_id": body.payload.refund.entity?.payment_id, "refundData.status": "pending" }, { $set: { "refund.status": "pending" } }, { returnDocument: 'after' });
        }

        if (body.event === 'refund.processed') {
            await orderModel.findOneAndUpdate({ "paymentData.razorpay_payment_id": body.payload.refund.entity?.payment_id }, { $set: { "refundData.status": "refunded", "refundData.refundedAt": Date.now() } }, { returnDocument: 'after' });
            console.log("refund.processed")

        }


        if (body.event === 'refund.failed') {
            await orderModel.findOneAndUpdate({ "paymentData.razorpay_payment_id": body.payload.refund.entity?.payment_id }, { $set: { "refundData.status": "failed" } }, { returnDocument: 'after' });
            console.log("refund.failed")

        }
        return res.status(200).json({ success: true })
    } catch (error) {
        return next(error)
    }
}



exports.ShiproketWebhook = async (req, res, next) => {
    try {

        const ApiKey = req.headers["x-api-key"]
        const myApiKey = process.env.SHIPROKET_WEBHOOK_API_KEY

        if (ApiKey !== myApiKey) {
            return next(CustomeError(401, "Unauthorized webhook"))

        }




        const payload = Array.isArray(req.body) ? req.body[0] : req.body;
        console.log("Shiprocket Webhook received:", JSON.stringify(payload));

        if (!payload || typeof payload !== "object") {
            return next(CustomeError(400, "Invalid webhook payload"))
        }


        const OrderStatus = (payload.current_status || payload.shipment_status || payload.status || "").toString().trim().toUpperCase();
        const isRTO = OrderStatus.startsWith("RTO") || OrderStatus.includes("RTO")
        const isReturn = !isRTO && (payload.is_return == 1 || payload.is_return === "1" || payload.is_return === true || OrderStatus.startsWith("RETURN"));


        if (isRTO) {
            if (OrderStatus == "RTO INITIATED") {
                let order = await orderModel.findOne({ orderNumber: payload.order_id })
                const refundData = {
                    method: "cod",
                    status: "not_required",
                    refundId: "",
                }
                const rtoData = {
                    status: OrderStatus
                }
                if (order.paymentData.method == "prepaid" && order.paymentData.status == "paid" && !refundData?.refundId) {
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
                    order = await orderModel.findByIdAndUpdate(order._id, { $set: { type: 'rto', status: "cancelled", refundData, rtoData, "paymentData.status": "failed" } }, { returnDocument: 'after' })

                } else {

                    order = await orderModel.findByIdAndUpdate(order._id, { $set: { type: 'rto', status: "cancelled", refundData, rtoData, "paymentData.status": "refunded" } }, { returnDocument: 'after' })
                }

                return res.status(200).json("ok")
            } else if (OrderStatus == "RTO IN TRANSIT") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "rtoData.status": OrderStatus } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            } else if (OrderStatus == "RTO OUT FOR DELIVERY") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "rtoData.status": OrderStatus } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            } else if (OrderStatus == "RTO DELIVERED" || OrderStatus == "RTO RECEIVED") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "rtoData.status": OrderStatus, "rtoData.completeAt": Date.now() } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }
        } else if (isReturn) {
            if (OrderStatus == "RETURN OUT FOR PICKUP") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "returnData.status": OrderStatus } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }

            if (OrderStatus == "QC FAILED") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "paymentData.status": "paid", "refundData.status": "failed", "returnData.status": OrderStatus, "returnData.completeAt": Date.now() } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }

            if (OrderStatus == "RETURN PICKED UP") {
                let order = await orderModel.findOne({ orderNumber: payload.order_id, })



                const refundData = {
                    method: "cod",
                    status: "pending",
                    refundId: null,
                }
                if (order.paymentData.method == "prepaid" && order.paymentData.status == "paid" && !refundData?.refundId) {
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
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "returnData.status": OrderStatus, refundData, "paymentData.status": "refunded" } }, { returnDocument: 'after' })
                return res.status(200).json("ok")


            }

            if (OrderStatus == "RETURN IN TRANSIT") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "returnData.status": OrderStatus } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }

            if (OrderStatus == "RETURN DELIVERED") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { "returnData.status": OrderStatus, "returnData.completeAt": Date.now() } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }

        } else {


            if (OrderStatus == "PICKED UP") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { status: "pickup" } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }

            if (OrderStatus == "SHIPPED") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { status: "shipped" } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }


            if (OrderStatus == "OUT FOR DELIVERY") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { status: "out_for_delivery" } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }

            if (OrderStatus == "DELIVERED") {
                order = await orderModel.findOneAndUpdate({ orderNumber: payload.order_id }, { $set: { status: "delivered", completeAt: Date.now(), "paymentData.status": "paid" } }, { returnDocument: 'after' })
                return res.status(200).json("ok")

            }


        }



        return res.status(200).json("ok")
    } catch (error) {
        return next(error)
    }
}