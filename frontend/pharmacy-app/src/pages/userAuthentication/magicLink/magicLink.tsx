import { useEffect, useState } from "react";
import { Button, controlToastState, TextInput } from "risa-oasis-ui_v2";
import MailIcon from "../../../svg/mail";
import { sendMagicLinkViaEmail } from "./utils/magicLinkAuth";

const MagicLink = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  const ALLOWED_DOMAIN = "risalabs.ai";

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isAllowedDomain = (email: string) => {
    return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
  };

  useEffect(() => {
    if (!isValidEmail(userEmail)) {
      setError("Please enter a valid email address and try again");
    } else if (!isAllowedDomain(userEmail)) {
      setError("Only @risalabs.ai email addresses are allowed");
    } else {
      setError("");
    }
  }, [userEmail]);

  const sendMagicLink = async () => {
    setIsLoading(true);
    const isMailSent = await sendMagicLinkViaEmail(userEmail);
    if (isMailSent) {
      controlToastState("email-sent-success");
      setIsEmailSent(true);
    } else {
      controlToastState("email-sent-failure");
      setIsEmailSent(false);
    }
    setIsLoading(false);
  };

  return (
    <div className="magic-link--container flex h-auto w-full flex-col items-center justify-center gap-3 p-4">
      <div className="welcome-text mb-2 text-center text-large font-bold">
        Welcome!
      </div>
      {!isEmailSent ? (
        <>
          <div className="email-container w-full">
            <TextInput
              id={"user_email"}
              label={"Email Address"}
              required
              onChange={(e) => setUserEmail(e.value)}
              error={error}
            />
          </div>
          <div className="email-link-button mt-2 w-full">
            <Button
              disabled={
                isLoading ||
                !isValidEmail(userEmail) ||
                !isAllowedDomain(userEmail)
              }
              children={isLoading ? "Sending..." : "Send Link"}
              onClick={sendMagicLink}
              buttonType={"primary"}
              size={"medium"}
            />
          </div>
        </>
      ) : (
        <>
          <div className="email-sent-message--container flex flex-col items-center gap-2">
            <div className="mail-icon">
              <MailIcon height="3rem" width="3rem" fillColor="#0056d6" />
            </div>
            <div className="mesage-header text-center text-h10 font-semibold">
              Check your inbox!
            </div>
            <div className="message-text text-center text-small text-primaryGray-4">
              We've sent a magic link to your email. <br /> Click the link in
              your mailbox to sign in.
            </div>
            <div className="message-sub-text text-center text-xs italic text-primaryGray-8">
              (Make sure to check your spam or promotions folder if you don’t
              see it soon.)
            </div>
            <div className="message-no-mail-received mt-1 text-center text-tiny text-primaryGray-4">
              Didn't receive the email? &nbsp; &nbsp;
              <span
                className="cursor-pointer text-tiny font-semibold text-tertiaryBlue-4 hover:underline"
                onClick={() => setIsEmailSent(false)}
              >
                Resend Email
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MagicLink;
