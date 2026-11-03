

exports.SendWhatsAppMessage = async (number, template_code, variables) => {
    try {
        console.log(number)
        console.log(template_code)
        console.log(variables)
        const response = await fetch(`https://iot.pixano.in//api/send-template`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${process.env.DELHIVERY_AUTH_TOKEN}`,
            },
            body: JSON.stringify({
                "instance_id": process.env.INSTANCE_ID,
                "access_token": process.env.WHATSAPP_ACCESS_TOKEN,
                "number": number,
                "template_code": template_code,
                "variables": variables
            }
            )
        });

        const data = await response.json();
        return data
    } catch (error) {
        console.log(error)
    }
}