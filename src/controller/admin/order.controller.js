const { default: mongoose } = require("mongoose")
const { CustomeError } = require("../../middleware/globelError")
const orderModel = require("../../model/order.model")
const { AssignCourierAndAWB, GenerateLabel, GeneratePickup } = require("../../services/shiproketapis")


exports.GetOrders = async (req, res, next) => {
    try {

        const orders = await orderModel.find({ type: "forward" }).populate("userId", "name email phone profile").sort({ createdAt: -1 })

        return res.status(200).json({ sucess: true, message: "Get All Orders", orders })

    } catch (error) {
        return next(error)
    }
}


exports.AccepteOrder = async (req, res, next) => {
    try {

        const { orderIds } = req.body || {}

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return next(CustomeError(422, "Order IDs not provided"));
        }

        const orders = await orderModel.aggregate([
            {
                $match: {
                    _id: {
                        $in: orderIds.map(id => new mongoose.Types.ObjectId(id))
                    },
                    status: "pending"
                }
            }
        ]);


        for (const order of orders) {
            const awsData = {
                shipment_id: order.shipmentData.shipment_id,
                courier_id: order.shipmentData.courier_id,

            }
            const assigneAwb = await AssignCourierAndAWB(awsData)

            if (assigneAwb.awb_assign_status != 0) {

                const customPickupDate = req.body?.pickupDate || null;
                const pickupResponse = await GeneratePickup(awsData.shipment_id, customPickupDate);
                const [pickupDate, pickupTime] = pickupResponse.response.pickup_scheduled_date.split(" ");
                const picuprequest = {
                    picupId: pickupResponse.response.pickup_token_number,
                    picupTime: pickupTime,
                    picupdate: pickupDate
                }

                await orderModel.findByIdAndUpdate(order._id, {
                    $set: {
                        "shipmentData.awb_number": assigneAwb.awb_code,
                        status: "accepted",
                        picuprequest
                    }
                },
                    { returnDocument: 'after' }
                );
            }


        }


        const updatedorders = await orderModel.find({ type: "forward" }).populate("userId", "name email phone profile").sort({ createdAt: -1 })
        console.log(updatedorders)
        return res.status(200).json({ sucess: true, message: "Orders Accepted", orders: updatedorders })


    } catch (error) {
        return next(error)
    }
}



exports.GenerateLabels = async (req, res, next) => {
    try {
        if (!req.body?.shipmentIds || !req.body?.shipmentIds?.length) {
            return next(CustomeError(422, "shipmentId not provided"));
        }

        const respons = await GenerateLabel(req.body?.shipmentIds);

        const notCreatedShipmentIds = respons?.not_created && typeof respons.not_created === "object"
            ? (Array.isArray(respons.not_created) ? respons.not_created : Object.keys(respons.not_created))
            : [];

        const successfulShipmentIds = (req.body?.shipmentIds || []).filter(
            (shipmentId) => !notCreatedShipmentIds.map(String).includes(String(shipmentId))
        );

        if (successfulShipmentIds.length > 0) {
            const updateOrders = await orderModel.updateMany(
                { shiprocketShipmentId: { $in: successfulShipmentIds }, status: "accepted" },
                { $set: { status: "processing" } }
            );
        }

        return res.status(200).json({
            success: true,
            message: respons?.message || "Label Generated",
            label_url: respons?.label_url || null,
        });

    } catch (error) {
        console.error("GenerateLabel Error:", JSON.stringify(error.response?.data || error.message, null, 2));
        return next(error);
    }
}