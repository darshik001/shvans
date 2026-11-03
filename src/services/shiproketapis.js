const axios = require("axios");


const getShiproketAccessToken = async () => {

    const url = "https://apiv2.shiprocket.in/v1/external/auth/login"
    const respons = await axios.post(url, {
        "email": process.env.SHIPROKET_EMAIL,
        "password": process.env.SHIPROKET_PASSWORD
    })

    return respons.data.token
}

exports.getshippingcharg = async (data) => {
    const pickupPincode = process.env.PICKUP_PINCODE;
    const url = "https://apiv2.shiprocket.in/v1/external/courier/serviceability";
    const token = await getShiproketAccessToken()

    const response = await axios.get(url, {
        params: {
            pickup_postcode: pickupPincode,
            delivery_postcode: data.pincode,
            weight: Number(data.weight),
            cod: Number(data.cod),
        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    // console.log(response.data.data.available_courier_companies)
    return response;

}


exports.getReturnshippingcharg = async (orderId) => {
    const deliveryPincode = process.env.PICKUP_PINCODE;



    const url = "https://apiv2.shiprocket.in/v1/external/courier/serviceability/";
    const token = await getShiproketAccessToken()
    const response = await axios.get(url, {
        params: {
            order_id: orderId,

        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;

}


exports.CreatOrderINShiproket = async (data) => {
    const url = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc";
    const token = await getShiproketAccessToken()

    const response = await axios.post(
        url,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}


exports.AssignCourierAndAWB = async (data) => {
    const url = "https://apiv2.shiprocket.in/v1/external/courier/assign/awb";
    const token = await getShiproketAccessToken()
    const response = await axios.post(
        url,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}



exports.GenerateLabel = async (data) => {
    const url = "https://apiv2.shiprocket.in/v1/external/courier/generate/label";
    const token = await getShiproketAccessToken()
    const response = await axios.post(
        url,
        { shipment_id: data },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}


exports.GeneratePickup = async (shipmentIds, pickupDate = null) => {
    const url = "https://apiv2.shiprocket.in/v1/external/courier/generate/pickup";
    const token = await getShiproketAccessToken();
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    const payload = {
        shipment_id: ids.map(id => Number(id) || id),
        ...(pickupDate ? { pickup_date: pickupDate } : {})
    };
    const response = await axios.post(
        url,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}


exports.ShiprocketCancel = async (id) => {
    
    const url = "https://apiv2.shiprocket.in/v1/external/orders/cancel";
    const token = await getShiproketAccessToken()
    const response = await axios.post(
        url,
        { ids: [id] },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}



exports.ShiproketReturnCreate = async (data) => {
    const url = "https://apiv2.shiprocket.in/v1/external/shipments/create/return-shipment";
    const token = await getShiproketAccessToken()
    const response = await axios.post(
        url,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );


    return response.data;
}