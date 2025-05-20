import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiConnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";

const { COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API } = studentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export async function buyCourse(token, coursesId, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Loading...");
    dispatch(setPaymentLoading(true));

    try {
        // Load Razorpay script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }

        // Get Razorpay key from environment
        const RAZORPAY_KEY = import.meta.env.VITE_APP_RAZORPAY_KEY_ID;
        console.log("Razorpay Key from env:", import.meta.env.VITE_APP_RAZORPAY_KEY);
        
        if (!RAZORPAY_KEY) {
            console.error("Razorpay key is missing. Please check your .env file");
            toast.error("Payment configuration error. Please check your environment setup.");
            return;
        }

        if (!RAZORPAY_KEY.startsWith('rzp_test_')) {
            console.error("Invalid Razorpay key format. Key should start with 'rzp_test_'");
            toast.error("Invalid payment configuration. Please check your setup.");
            return;
        }

        // Create order
        const orderResponse = await apiConnector(
            "POST",
            COURSE_PAYMENT_API,
            { coursesId },
            {
                Authorization: `Bearer ${token}`,
            }
        );

        if (!orderResponse.data.success) {
            throw new Error(orderResponse.data.message);
        }

        // Configure Razorpay options
        const options = {
            key: RAZORPAY_KEY,
            amount: orderResponse.data.message.amount,
            currency: orderResponse.data.message.currency,
            name: "Edemy",
            description: "Course Purchase",
            order_id: orderResponse.data.message.id,
            image: rzpLogo,
            prefill: {
                name: userDetails.firstName + " " + userDetails.lastName,
                email: userDetails.email,
            },
            handler: async function (response) {
                try {
                    // Send payment success email
                    await sendPaymentSuccessEmail(response, orderResponse.data.message.amount, token);
                    
                    // Verify payment
                    const verifyResponse = await verifyPayment(
                        { ...response, coursesId },
                        token,
                        navigate,
                        dispatch
                    );

                    if (verifyResponse) {
                        toast.success("Payment Successful");
                        navigate("/dashboard/enrolled-courses");
                        dispatch(resetCart());
                    }
                } catch (error) {
                    console.error("Payment verification error:", error);
                    toast.error("Payment verification failed");
                }
            },
            theme: {
                color: "#FFD60A"
            }
        };

        // Initialize Razorpay
        const paymentObject = new window.Razorpay(options);
        
        // Handle payment failure
        paymentObject.on("payment.failed", function (response) {
            console.error("Payment failed:", response.error);
            toast.error("Payment failed. Please try again");
            dispatch(setPaymentLoading(false));
        });

        // Open payment window
        paymentObject.open();

    } catch (error) {
        console.error("Payment error:", error);
        if (error.response) {
            toast.error(error.response?.data?.message || "Payment failed");
        } else if (error.request) {
            toast.error("Network error. Please check your connection");
        } else {
            toast.error("An unexpected error occurred");
        }
    } finally {
        toast.dismiss(toastId);
        dispatch(setPaymentLoading(false));
    }
}

async function sendPaymentSuccessEmail(response, amount, token) {
    try {
        await apiConnector(
            "POST",
            SEND_PAYMENT_SUCCESS_EMAIL_API,
            {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                amount,
            },
            {
                Authorization: `Bearer ${token}`,
            }
        );
    } catch (error) {
        console.error("Email sending error:", error);
    }
}

async function verifyPayment(bodyData, token, navigate, dispatch) {
    try {
        const response = await apiConnector(
            "POST",
            COURSE_VERIFY_API,
            bodyData,
            {
                Authorization: `Bearer ${token}`,
            }
        );

        if (!response.data.success) {
            throw new Error(response.data.message);
        }

        return true;
    } catch (error) {
        console.error("Verification error:", error);
        toast.error("Payment verification failed");
        return false;
    }
}