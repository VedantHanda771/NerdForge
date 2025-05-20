import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import { Link } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { RxCountdownTimer } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { sendOtp, signUp } from "../services/operations/authAPI";
import { useNavigate } from "react-router-dom";
import Loading from './../components/common/Loading';
import { toast } from "react-hot-toast";

function VerifyEmail() {
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { signupData, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!signupData) {
      navigate("/signup");
    }
  }, [signupData, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    const { accountType, firstName, lastName, email, password, confirmPassword } = signupData;
    await dispatch(signUp(accountType, firstName, lastName, email, password, confirmPassword, otp, navigate));
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      await dispatch(sendOtp(signupData.email, navigate));
      setCountdown(60);
      setOtp("");
      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center">
      <div className="max-w-[500px] p-4 lg:p-8">
        <h1 className="text-richblack-5 font-semibold text-[1.875rem] leading-[2.375rem]">
          Verify Email
        </h1>

        <p className="text-[1.125rem] leading-[1.625rem] my-4 text-richblack-100">
          A verification code has been sent to you. Enter the code below
        </p>

        <form onSubmit={handleVerifyAndSignup}>
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderInput={(props) => (
              <input
                {...props}
                placeholder="-"
                className="w-[48px] lg:w-[60px] border-0 bg-richblack-800 rounded-[0.5rem] text-richblack-5 aspect-square text-center focus:border-0 focus:outline-2 focus:outline-yellow-50"
              />
            )}
            containerStyle={{
              justifyContent: "space-between",
              gap: "0 6px",
            }}
          />

          <button
            type="submit"
            className="w-full bg-yellow-50 py-[12px] px-[12px] rounded-[8px] mt-6 font-medium text-richblack-900"
            disabled={otp.length !== 6}
          >
            Verify Email
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <Link to="/signup">
            <p className="text-richblack-5 flex items-center gap-x-2">
              <BiArrowBack /> Back To Signup
            </p>
          </Link>

          <button
            className={`flex items-center gap-x-2 ${
              countdown > 0 ? "text-richblack-300" : "text-blue-100"
            }`}
            onClick={handleResendOTP}
            disabled={countdown > 0 || isResending}
          >
            <RxCountdownTimer />
            {isResending ? "Resending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend it"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;