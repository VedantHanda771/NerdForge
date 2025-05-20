import React from "react";

// Direct imports of required icons
import { BiWorld } from "react-icons/bi";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { IoCall } from "react-icons/io5";

// Contact details array with actual icon components
const contactDetails = [
  {
    icon: HiChatBubbleLeftRight,
    heading: "Chat on us",
    description: "Our friendly team is here to help.",
    details: "info@studynotion.com",
  },
  {
    icon: BiWorld,
    heading: "Visit us",
    description: "Come and say hello at our office HQ.",
    details: "Akshya Nagar 1st Block 1st Cross, Rammurthy nagar, Bangalore-560016",
  },
  {
    icon: IoCall,
    heading: "Call us",
    description: "Mon - Fri From 8am to 5pm",
    details: "+123 456 7869",
  },
  {
    // Fallback section (no icon, just name & details)
    heading: "Email Us",
    description: "Reach out anytime for help.",
    details: "info@learnism.com",
  },
];

const ContactDetails = () => {
  return (
    <div className="flex flex-col gap-6 rounded-xl bg-richblack-800 p-4 lg:p-6">
      {contactDetails.map((ele, index) => (
        <div
          key={index}
          className="flex flex-col gap-[2px] p-3 text-sm text-richblack-200"
        >
          {/* Only show icon and heading if icon exists */}
          {(ele.icon || ele.heading) && (
            <div className="flex flex-row items-center gap-3">
              {ele.icon && <ele.icon size={25} className="text-yellow-50" />}
              {ele.heading && (
                <h1 className="text-lg font-semibold text-richblack-5">
                  {ele.heading}
                </h1>
              )}
            </div>
          )}

          {ele.description && <p className="font-medium">{ele.description}</p>}
          {ele.details && <p className="font-semibold">{ele.details}</p>}
        </div>
      ))}
    </div>
  );
};

export default ContactDetails;
